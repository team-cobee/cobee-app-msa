import React, { useState, useEffect } from 'react';
import {api} from '@/api/api';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Double } from 'react-native/Libraries/Types/CodegenTypes';
import { Gender, Lifestyle, MatchStatus, Personality, RecruitStatus, SocialType } from '@/types/enums';
import { set } from 'react-hook-form';
import { getAccessToken } from '@/api/tokenStorage';

interface MatchingStatusScreenProps {
  onBack: () => void;
  onNavigateToJob: (jobId: number) => void;
}

interface RecruitResponse{
  postId : number,
  title: string,
  viewed : number,
  bookmarked : number,
  createdAt : string,
  status : RecruitStatus,

  authorId : number,
  authorName : string,
  authorGender : Gender,
  birthdate : string,

  recruitCount : number
  hasRoom: boolean;  // true : 방있음, false : 함께 찾기
  rentalCostMin: number;
  rentalCostMax: number;
  monthlyCostMin: number;
  monthlyCostMax: number;

  preferedGender : Gender,
  preferedMinAge : number,
  preferedMaxAge : number,
  preferedLifeStyle?: Lifestyle;
  preferedPersonality?: Personality
  preferedSmoking?: boolean
  preferedSnoring?: boolean
  preferedHasPet?: boolean

  address : string,
  latitude : Double,
  longitude : Double,

  detailDescript : string,
  additionalDescript : string,
  imgUrl: string[] | null;
}

interface authInfo {
  id : number,
  name : string,
  email : string,
  birthDate: string,
  gender : Gender
  socialType: SocialType,
  isCompleted : boolean,
  ocrValidation: boolean | null,
  isHost: true
}

interface applicantsInfo {
    userId : number,
    name : number,
    gender : string,
    profileImageUrl : string,
    info : string,
    mLifestyle : Lifestyle,
    mPersonality : Personality,
    mSmoking : boolean,
    mSnoring : boolean,
    mPet : boolean
}

export default function MatchingStatusScreen({ onBack, onNavigateToJob }: MatchingStatusScreenProps) {
  const [activeTab, setActiveTab] = useState('applied');
  const [myOnWaitPost, setMyOnwaitPost] = useState<RecruitResponse[]>([]);
  const [myOnMatchingPost, setMyMatchingPost] = useState<RecruitResponse[]>([]);  // accept 받으면 
  const [myMatchedPost, setMyMatchedPost] = useState<RecruitResponse[]>([]);
  const [userInfo, setUserInfo] = useState<authInfo | null>(null);

  useEffect(() => {
      let cancelled = false;
  
      const load = async () => {
   
        try {
          const myOnWait = await api.get(`/apply/my?status=ON_WAIT`,{
            headers: { Authorization: `Bearer ${getAccessToken}` }
          });
          console.log(myOnWait.data.data)// 지원한 구인글 
          const myOnMatching = await api.get(`/apply/my/matching`); // 초대받은 구인글 
          const myMatched = await api.get(`/apply/my/matched`);  // 매칭완료 구인글 
          const userRes = await api.get(`/auth`);

          if (cancelled) return;
        
          setMyOnwaitPost(myOnWait.data.data ?? null);
          setMyMatchingPost(myOnMatching.data?.data ?? null);
          setMyMatchedPost(myMatched.data?.data ?? null);
          setUserInfo(userRes.data?.data ?? null);
          
          console.log(myOnWait.data);
          console.log(myOnMatching.data);
          console.log(myMatched.data);
          console.log(userRes.data);

        } catch (e) {
          console.error(e);
        }
      };
  
      load();
      return () => {
        cancelled = true;
      };
    }, []);

  const tabs = [
    { id: 'applied', label: '지원한 구인글', count: myOnWaitPost?.length },
    { id: 'matched', label: '매칭 완료', count: myMatchedPost?.length },
    { id: 'invited', label: '초대받은 구인글', count: myMatchedPost?.length }
  ];

  const renderJobCard = (job: any, showParticipants = false) => (
    <TouchableOpacity 
      key={job.postId}
      onPress={() => onNavigateToJob(job.postId)}
      activeOpacity={0.7}
    >
      <Card>
        <CardContent style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500', fontSize: 14, marginBottom: 4 }}>{job.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>📍</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>{job.address}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                작성자: {job.authorName} • 월세 {job.monthlyCostMin}만원
              </Text>
            </View>
            <Badge>
              <Text style={{ fontSize: 12 }}>
                {job.status}
              </Text>
            </Badge>
          </View>

          {showParticipants && job.participants && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>👥</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                참여자: {job.participants.join(', ')}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>🕐</Text>
              {/* <Text style={{ fontSize: 12, color: '#6b7280' }}>
                {job.appliedAt && `지원일: ${job.appliedAt}`}
                {job.matchedAt && `매칭일: ${job.matchedAt}`}
                {job.invitedAt && `초대일: ${job.invitedAt}`}
              </Text> */}
            </View>
            {job.status === MatchStatus.Matched && (
              <Text style={{ color: '#22c55e', fontSize: 16 }}>✓</Text>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'applied':
        return (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              내가 지원한 구인글 목록을 보여줍니다
            </Text>
            {myOnWaitPost.length > 0 ? (
              myOnWaitPost.map(job => renderJobCard(job))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 32, color: '#9ca3af' }}>👥</Text>
                </View>
                <Text style={{ color: '#6b7280', marginBottom: 4 }}>지원한 구인글이 없어요</Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>관심있는 구인글에 지원해보세요</Text>
              </View>
            )}
          </View>
        );
      
      case 'matched':
        return (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              매칭이 완료된 구인글입니다
            </Text>
            {myMatchedPost.length > 0 ? (
              myMatchedPost.map(job => renderJobCard(job, true))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 32, color: '#9ca3af' }}>✓</Text>
                </View>
                <Text style={{ color: '#6b7280', marginBottom: 4 }}>매칭 완료된 구인글이 없어요</Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>채팅을 통해 매칭을 완료해보세요</Text>
              </View>
            )}
          </View>
        );
      
      case 'invited':
        return (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              구인글 채팅방에 초대받은 경우의 목록입니다
            </Text>
            {myOnMatchingPost.length > 0 ? (
              myOnMatchingPost.map(job => renderJobCard(job))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 32, color: '#9ca3af' }}>🕐</Text>
                </View>
                <Text style={{ color: '#6b7280', marginBottom: 4 }}>초대받은 구인글이 없어요</Text>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>구인글에 지원하면 채팅방에 초대받을 수 있어요</Text>
              </View>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* 헤더 */}
      <View style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>지원 상태</Text>
        </View>
      </View>

      <ScrollView style={{ padding: 16 }}>
        {/* 탭 네비게이션 */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#f3f4f6',
          padding: 4,
          borderRadius: 8,
          marginBottom: 24
        }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: activeTab === tab.id ? '#F7B32B' : '#6b7280'
              }}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(247, 179, 43, 0.1)' : '#e5e7eb',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: activeTab === tab.id ? '#F7B32B' : '#6b7280'
                  }}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 컨텐츠 */}
        {renderContent()}
      </ScrollView>
    </View>
  );
}