import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {api} from '../api/api';
import { getAccessToken} from '@/api/tokenStorage';
import { Gender, MatchStatus } from '@/types/enums';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ApplicantsScreenProps {
  postId: number | null;
  onBack: () => void;
  onNavigateToProfile?: (userId: number) => void;
  onNavigateToChat?: (userId: number) => void;
}

/** 백엔드 응답 스키마 */
interface Applicant {
  memberName : string;
  publicProfileId : number;
  birthDate: string;
  gender: string;
  matchStatus: MatchStatus;
  applyId : number
}

interface ApplyResponse {
    id : number;
    appliedPostId : number;
    appliedMemberId : number;
    isMatched : MatchStatus;
}

type FilterKey = 'all' | MatchStatus;
const filters: { key: FilterKey; label: string }[] = [
  { key: 'all',               label: '전체' },
  { key: MatchStatus.OnWait,  label: '검토중' },
  { key: MatchStatus.Matching,label: '승인됨' },
  { key: MatchStatus.Rejected,label: '거절됨' },
];

export default function ApplicantsScreen({
  postId,
  onBack,
  onNavigateToProfile,
}: ApplicantsScreenProps) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null> (null)

  const getPostTitle = async() => {
    const token = await getAccessToken().catch(() => null);  
    const res = await api.get(`/recruit/${postId}`,{
      headers: token ? { Authorization: `Bearer ${token}` } : {},       
    }
  )
  setTitle(res.data.data.title);
};

  const getStatusText = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.OnWait:
        return '승인 전';
      case MatchStatus.Matching:
        return '매칭중';
      case MatchStatus.Rejected:
        return '거절됨';
      case MatchStatus.Matched:
        return '매칭 완료'
      default:
        return '알 수 없음';
    }
  };

  const getGenderText = (gender: Gender) => {
    switch (gender) {
      case Gender.Female:
        return '여성';
      case Gender.Male:
        return '남성';
      default:
        return '알 수 없음';
    }
  };

const filteredApplicants = useMemo(() => {
  const list = Array.isArray(applicants) ? applicants : [];   // ✅ 안전 보정
  return selectedFilter === 'all'
    ? list
    : list.filter(a => a.matchStatus === selectedFilter);
}, [applicants, selectedFilter]);

  const counts = useMemo(() => {
    const list = Array.isArray(applicants) ? applicants : [];   //  안전 보정을 위한 코드 NPE 주의 
    const by = (s: MatchStatus) => list.filter(a => a.matchStatus === s).length;

    return {
      total: list.length,
      pending: by(MatchStatus.OnWait),
      accepted: by(MatchStatus.Matching),
      matched: by(MatchStatus.Matched),
      rejected: by(MatchStatus.Rejected),
    };
  }, [applicants]);



    /* 데이터 로더 */
    const fetchApplicants = useCallback(async () => {
    if (!postId) {                      // postId 없으면 빈 목록 처리
      setApplicants([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken().catch(() => null);  
      const res = await api.get(`/apply/${postId}/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, 
      });

      // 응답을 방어적으로 배열 추출
      const payload = res?.data?.data ?? res?.data ?? [];
      const list =
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
          ? payload.content
          : [];

      setApplicants(list as Applicant[]);
    } catch (e: any) {
      setError(e?.message ?? '목록을 불러오는 중 오류가 발생했습니다.');
      setApplicants([]);                // ✅ 실패 시에도 배열로 유지
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchApplicants();
    } finally {
      setRefreshing(false);
    }
  }, [fetchApplicants]);

  const acceptApplicant = async (id: number, isAccept : boolean) => {
  try {
    const token = await getAccessToken().catch(() => null);

    const res = await api.post(
      `/apply/accept/${id}`, {isAccept : isAccept},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    
    console.log(res.data?? res.data.data);
    return res.data.data; // 필요 시 res.data.data 반환
  } catch (e: any) {
    // 에러 핸들링(선택)
    throw new Error(e?.response?.data?.message ?? e?.message ?? '승인 요청 실패');
  }
  };

  // 로컬 상태 변경(승인/거절) — 서버 반영은 필요 시 추가
  const handleAccept = useCallback(async (applicantId: number) => {
  try {
    await acceptApplicant(applicantId, true); // ← 반드시 await
    console.log("승인 성공");
    await fetchApplicants();
  } catch (e: any) {
    //setApplicants(prev => prev.map(a => a.applyId === applicantId ? { ...a, matchStatus: MatchStatus.OnWait } : a));
    Alert.alert('승인 실패', e?.message ?? '네트워크 오류가 발생했습니다.');
  }
}, [acceptApplicant, fetchApplicants]);


  const handleReject = async(applicantId: number, isAccept : boolean) => {
    try {
      const token = await getAccessToken().catch(() => null);

      const res = await api.post(
        `/apply/accept/${applicantId}`, {isAccept : isAccept},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      console.log(res.data?? res.data.data);
    } catch {

      }
    }

        useEffect(() => {
      fetchApplicants();
      getPostTitle();
  }, [fetchApplicants]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingTop: 50,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>지원자 목록</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{title}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 로딩 표시 */}
      {loading && applicants.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* 에러 표시 */}
          {error && (
            <Card style={{ marginBottom: 16 }}>
              <CardContent style={{ padding: 16 }}>
                <Text style={{ color: '#dc2626', marginBottom: 8 }}>목록을 불러오지 못했습니다.</Text>
                <Text style={{ color: '#6b7280' }}>{error}</Text>
                <View style={{ height: 8 }} />
                <Button variant="outline" onPress={fetchApplicants}>
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 통계 */}
          <Card style={{ marginBottom: 16 }}>
            <CardContent style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#F7B32B' }}>{counts.total}</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>총 지원자</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#d97706' }}>{counts.pending}</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>검토중</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#16a34a' }}>{counts.accepted}</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>승인됨</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#dc2626' }}>{counts.rejected}</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>거절됨</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 필터 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
              {filters.map((filter) => (
                <Button
                  key={String(filter.key)}
                  variant={selectedFilter === filter.key ? 'default' : 'outline'}
                  onPress={() => setSelectedFilter(filter.key)}
                  style={selectedFilter === filter.key ? { backgroundColor: '#F7B32B' } : {}}
                >
                  {filter.label}
                </Button>
              ))}
            </View>
          </ScrollView>

          {/* 지원자 목록 */}
          <View style={{ gap: 16 }}>
            {filteredApplicants.map((applicant, idx) => (
              <Card key={`${applicant.applyId}-${idx}`}>
                <CardContent style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Avatar style={{ width: 64, height: 64 }}>
                      <AvatarFallback>{applicant.memberName.slice(0, 2)}</AvatarFallback>
                    </Avatar>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '600' }}>{applicant.memberName}</Text>
                            <Badge>{getStatusText(applicant.matchStatus)}</Badge>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <Text style={{ fontSize: 14, color: '#6b7280' }}>
                              {applicant.gender} • {applicant.birthDate}
                            </Text>
                          </View>
                        </View>
                        
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {applicant.matchStatus === MatchStatus.OnWait && (
                          <>
                            <Button
                              onPress={() => handleAccept(applicant.applyId)}
                              style={{ backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 8 }}
                            >
                              <Text style={{ color: 'white', fontSize: 14 }}>✓ 승인</Text>
                            </Button>
                            <Button
                              variant="outline"
                              onPress={() => handleReject(applicant.applyId, false)}
                              style={{ borderColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8 }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="close" size={14} color="#dc2626" />
                                <Text style={{ color: '#dc2626', fontSize: 14 }}>거절</Text>
                              </View>
                            </Button>
                          </>
                        )}

                        <Button
                          variant="outline"
                          onPress={() => onNavigateToProfile?.(applicant.publicProfileId)}
                          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                        >
                          <Text style={{ fontSize: 14 }}>👤 프로필 보기</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>

          {filteredApplicants.length === 0 && !loading && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 32, color: '#9ca3af' }}>👤</Text>
              </View>
              <Text style={{ fontWeight: '500', marginBottom: 8 }}>
                {selectedFilter === 'all' ? '지원자가 없어요' : `${getStatusText(selectedFilter)} 지원자가 없어요`}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                {selectedFilter === 'all' ? '아직 아무도 지원하지 않았습니다.' : '다른 상태의 지원자를 확인해보세요.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
