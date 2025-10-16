import { Gender, MatchStatus, Lifestyle, Snoring, Smoking, Personality, Pets } from '@/types/enums';
import React, { useState } from 'react';
import { AddressResult } from '../components/AddressSearchModal';
import AddressSearchModal from '../components/AddressSearchModal';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions,
  Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../api/api';

const { width } = Dimensions.get('window');

/** 프론트 값 → 서버 enum 문자열 매핑 */
const toLifestyleEnum = (v: string) =>
  v === 'morning' ? 'MORNING' : v === 'evening' ? 'NIGHT' : 'NONE';
const toPersonalityEnum = (v: string) =>
  v === 'introvert' ? 'INTROVERT' : v === 'extrovert' ? 'EXTROVERT' : 'NONE';
const toSmokingEnum = (v: string) => {
  switch (v) {
    case 'impossible': return 'IMPOSSIBLE';
    case 'none': return 'NONE';
    default: return 'NONE';
  }
};
const toSnoringEnum = (v: string) => {
  switch (v) {
    case 'impossible': return 'IMPOSSIBLE';
    case 'none': return 'NONE';
    default: return 'NONE';
  }
};
const toPetsEnum = (v: string) => {
  switch (v) {
    case 'possible': return 'POSSIBLE';
    case 'impossible': return 'IMPOSSIBLE';
    default: return 'NONE';
  }
};

/** 서버에 보낼 Request 타입(백엔드 RecruitRequest와 1:1) */
type RecruitRequest = {
  title: string;
  recruitCount: number;
  rentCostMin: number;
  rentCostMax: number;
  monthlyCostMin: number;
  monthlyCostMax: number;
  minAge: number;
  maxAge: number;
  lifestyle: Lifestyle
  personality: Personality
  isSmoking: Smoking
  isSnoring: Snoring
  isPetsAllowed: Pets
  hasRoom: boolean;
  imgUrl: string[];
  address: string;
  detailDescription: string;
  additionalDescription: string;
};

interface CreateJobPostingProps {
  onBack: () => void;
  onSuccess: () => void;
  onComplete: (postId: string) => void; // 서버에서 생성된 postId를 문자열로 콜백
  editJobId?: string | null;
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  spacer: { width: 24, height: 24 },
  content: { flex: 1, padding: 16 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  progressDotActive: { backgroundColor: '#F7B32B' },
  stepContainer: { gap: 24 },
  stepHeader: { alignItems: 'center', marginBottom: 24 },
  stepTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  formSection: { gap: 24 },
  fieldContainer: { gap: 1},
  addressContainer: {flexDirection: 'row', gap: 8, alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  optionsContainer: { gap: 12 },
  optionButton: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#ffffff',
  },
  optionButtonSelected: { borderColor: '#F7B32B', backgroundColor: '#fef3c7' },
  optionText: { fontSize: 16, color: '#374151', textAlign: 'center' },
  rangeInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeInput: { flex: 1 },
  rangeLabel: { fontSize: 14, color: '#6b7280' },
  nextButtonContainer: { paddingTop: 24, gap: 12 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  buttonFlex: { flex: 1 },
  urlRow: { flexDirection: 'row', gap: 8 },
  urlItem: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 8,
  },
});

export default function CreateJobPosting({
  onBack, onSuccess, onComplete, editJobId,
}: CreateJobPostingProps) {
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8, // 품질을 낮춰서 HEIC 호환성 개선
      allowsEditing: false,
      // HEIC 파일을 JPEG로 강제 변환
      exif: false,
      base64: false,
    });

    if (!result.canceled) {
      // HEIC 파일 필터링 및 경고
      const validAssets = result.assets.filter(asset => {
        const isHeic = asset.mimeType === 'image/heic' || asset.uri.toLowerCase().includes('.heic');
        if (isHeic) {
          console.log('HEIC 파일 감지, 건너뛰기:', asset.fileName);
          return false; // HEIC 파일은 제외
        }
        return true;
      });

      if (validAssets.length !== result.assets.length) {
        Alert.alert(
          '알림', 
          'HEIC 형식의 이미지는 현재 지원하지 않습니다.\n설정에서 카메라 형식을 "호환성 우선"으로 변경해주세요.',
          [{ text: '확인' }]
        );
      }

      setSelectedImages([...selectedImages, ...validAssets]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

// 주소 선택 핸들러
const handleAddressSelect = (addr: AddressResult) => {
  console.log('주소 선택됨:', addr);
  console.log('설정할 주소:', addr.fullAddress);
  
  setSelectedAddress(addr.fullAddress);        // 선택된 주소 저장
  setShowAddressModal(false);                  // 모달 닫기
  setFormData((prev) => ({ 
    ...prev, 
    address: addr.fullAddress 
  })); // ✅ input 값 자동완성
  
  console.log('formData.address 업데이트됨:', addr.fullAddress);
};



  /** 폼 상태(화면 → 서버 요청으로 변환할 로우 데이터) */
  const [formData, setFormData] = useState({
    // Step 1
    title: '',
    recruitCount: 2,
    depositMin: 500,     // → rentCostMin
    depositMax: 1000,    // → rentCostMax
    monthlyRentMin: 50,  // → monthlyCostMin
    monthlyRentMax: 100, // → monthlyCostMax

    // Step 2
    ageMin: 20,
    ageMax: 90,
    lifestyle: '',       // 'morning' | 'evening' | (기타 → 'NONE')
    personality: '',     // 'introvert' | 'extrovert' | 'none'
    smoking: '',         // 'no' | 'yes' | 'any'
    snoring: '',         // 'no' | 'yes' | 'any'
    pets: '',            // 'have' | 'nothave' | 'possible' | 'impossible' | 'any'

    // Step 3
    hasRoom: '',         // 'has' | 'none'

    // Step 4 (주소/좌표)
    address: '',
    latitude: '',        // 입력은 string, 제출시 number|null 로 변환
    longitude: '',
    // distance: '',

    // Step 5 (이미지)
    images: [] as string[],

    // 추가 설명
    detailDescription: '',
    additionalDescription: '',
  });

  // const handleFileSelect = async () => {
  //     try {
  //       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //       if (status !== 'granted') {
  //         Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.');
  //         return;
  //       }
  
  //       const result = await ImagePicker.launchImageLibraryAsync({
  //         mediaTypes: ['images'],
  //         base64: false,
  //         quality: 0.9,
  //         allowsEditing: false,
  //       });
  //       if (result.canceled) return;
  
  //       const asset = result.assets[0];
  //       const mime = asset.mimeType ?? 'image/jpeg';
  //       const name = asset.fileName ?? `id-${Date.now()}.jpg`;
  
  //       setFormData(prev => ({
  //         ...prev,
  //         idImageFile: asset.uri,
  //         idImagePreview: asset.uri,
  //       }));
  
  //       setUploadState({ isUploading: false, isProcessing: true, error: null }); // 로딩 표시
  //       await processOCR({ uri: asset.uri, name, type: mime });
  //     } catch (e: any) {
  //       Alert.alert('오류', e?.message ?? '이미지 선택 중 오류가 발생했습니다.');
  //     }
  //   };

  const totalSteps = 5;

  const nextStep = () => {
    console.log('nextStep called, step:', step, 'totalSteps:', totalSteps);
    return step < totalSteps ? setStep(step + 1) : handleSubmit();
  };
  const prevStep = () => setStep(step - 1);

  /** 단계별 유효성 검사 */
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0 && formData.recruitCount > 0;
      case 2: {
        const ageOK =
          Number.isFinite(formData.ageMin) &&
          Number.isFinite(formData.ageMax) &&
          formData.ageMin <= formData.ageMax;
        return (
          ageOK &&
          !!formData.lifestyle &&
          !!formData.personality &&
          !!formData.smoking &&
          !!formData.snoring &&
          !!formData.pets
        );
      }
      case 3:
        return !!formData.hasRoom;
      case 4:
        // 방이 있으면 주소 필수, 좌표/거리 선택
        return /*formData.hasRoom === 'none'*/ formData.address.trim().length > 0;
      case 5:
      default:
        return true;
    }
  };

  /** 제출 → /recruits/with-images (POST) */
  const handleSubmit = async () => {
    console.log('handleSubmit called');
    try {
      console.log('Creating requestDto...');
      const requestDto: Omit<RecruitRequest, 'imgUrl'> & { imgUrl?: string[] } = {
          title: formData.title,
          recruitCount: Number(formData.recruitCount),
          rentCostMin: Number(formData.depositMin),
          rentCostMax: Number(formData.depositMax),
          monthlyCostMin: Number(formData.monthlyRentMin),
          monthlyCostMax: Number(formData.monthlyRentMax),
          minAge: Number(formData.ageMin),
          maxAge: Number(formData.ageMax),
          lifestyle: toLifestyleEnum(formData.lifestyle) as RecruitRequest['lifestyle'],
          personality: toPersonalityEnum(formData.personality) as RecruitRequest['personality'],
          isSmoking: toSmokingEnum(formData.smoking) as RecruitRequest['isSmoking'],
          isSnoring: toSnoringEnum(formData.snoring) as RecruitRequest['isSnoring'],
          isPetsAllowed: toPetsEnum(formData.pets) as RecruitRequest['isPetsAllowed'],
          hasRoom: formData.hasRoom === 'has',
          address: formData.address,
          detailDescription: formData.detailDescription,
          additionalDescription: formData.additionalDescription,
      };
      
      console.log('RequestDto created:', requestDto);
      
      // The backend expects imgUrl to be part of the DTO, but it will be empty since files are sent separately
      requestDto.imgUrl = [];

      console.log('Creating FormData...');
      const form = new FormData();
      
      // React Native에서 JSON을 @RequestPart로 보내는 올바른 방법
      form.append('request', {
        string: JSON.stringify(requestDto),
        type: 'application/json'
      } as any);

      console.log('Adding images to FormData...', selectedImages.length);
      selectedImages.forEach((image, index) => {
        console.log(`Adding image ${index}:`, image.uri, 'mimeType:', image.mimeType);
        
        // Ensure proper MIME type and convert HEIC to JPEG
        let mimeType = image.mimeType || 'image/jpeg';
        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          mimeType = 'image/jpeg';
        }
        if (mimeType === 'application/octet-stream' || !mimeType.startsWith('image/')) {
          mimeType = image.uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        }
        
        const file = {
          uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
          type: mimeType,
          name: image.fileName || `image-${Date.now()}-${index}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
        };
        console.log('File object:', file);
        form.append('images', file as any);
      });

      console.log('Sending request to /recruits/with-images...');
      console.log('FormData keys:', Object.keys(form));
      
      const res = await api.post('/recruits/with-images', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      console.log('Response received:', res.data);
      console.log('Response data type:', typeof res.data);
      console.log('Response data keys:', res.data ? Object.keys(res.data) : 'null/undefined');
      
      const data = res.data?.data ?? res.data;
      const postId = data?.postId ?? data?.id;
      
      console.log('Extracted data:', data);
      console.log('Extracted postId:', postId);

      console.log('Success! PostId:', postId);
      Alert.alert('성공', '구인글이 등록되었습니다.');
      onComplete(String(postId ?? `post_${Date.now()}`));
      
    } catch (e: any) {
      console.error('Error in handleSubmit:', e);
      console.error('Error response:', e.response?.data);
      console.error('Error message:', e?.message);
      Alert.alert('실패', e?.message ?? '등록 중 오류가 발생했습니다.');
    }
  };

  /** ─── Step 1: 기본 정보 ─── */
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>기본 정보</Text>
        <Text style={styles.stepSubtitle}>구인글의 기본 정보를 입력해주세요</Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>제목</Text>
          <Input
            placeholder="ex) 강남역 근처 깔끔한 원룸 룸메이트 구해요"
            value={formData.title}
            onChangeText={(t) => setFormData({ ...formData, title: t })}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>인원</Text>
          <View style={styles.optionsContainer}>
            {[2, 3, 4, 5].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.optionButton,
                  formData.recruitCount === count && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, recruitCount: count })}
              >
                <Text style={styles.optionText}>{count}명</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>보증금 범위 (만원)</Text>
          <View style={styles.rangeInputContainer}>
            <Input
              style={styles.rangeInput}
              placeholder="최소"
              value={String(formData.depositMin)}
              onChangeText={(t) => setFormData({ ...formData, depositMin: parseInt(t) || 0 })}
              keyboardType="numeric"
            />
            <Text style={styles.rangeLabel}>~</Text>
            <Input
              style={styles.rangeInput}
              placeholder="최대"
              value={String(formData.depositMax)}
              onChangeText={(t) => setFormData({ ...formData, depositMax: parseInt(t) || 0 })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>월세 범위 (만원)</Text>
          <View style={styles.rangeInputContainer}>
            <Input
              style={styles.rangeInput}
              placeholder="최소"
              value={String(formData.monthlyRentMin)}
              onChangeText={(t) => setFormData({ ...formData, monthlyRentMin: parseInt(t) || 0 })}
              keyboardType="numeric"
            />
            <Text style={styles.rangeLabel}>~</Text>
            <Input
              style={styles.rangeInput}
              placeholder="최대"
              value={String(formData.monthlyRentMax)}
              onChangeText={(t) => setFormData({ ...formData, monthlyRentMax: parseInt(t) || 0 })}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    </View>
  );

  /** ─── Step 2: 선호/제약 ─── */
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>선호/제약 조건</Text>
        <Text style={styles.stepSubtitle}>원하는 룸메이트 조건을 선택해주세요</Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>나이 범위</Text>
          <View style={styles.rangeInputContainer}>
            <Input
              style={styles.rangeInput}
              placeholder="최소"
              value={String(formData.ageMin)}
              onChangeText={(t) => setFormData({ ...formData, ageMin: parseInt(t) || 0 })}
              keyboardType="numeric"
            />
            <Text style={styles.rangeLabel}>~</Text>
            <Input
              style={styles.rangeInput}
              placeholder="최대"
              value={String(formData.ageMax)}
              onChangeText={(t) => setFormData({ ...formData, ageMax: parseInt(t) || 0 })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>라이프스타일</Text>
          <View style={styles.optionsContainer}>
            {[
              { value: 'morning', label: '아침형' },
              { value: 'evening', label: '저녁형' },
              { value: 'flexible', label: '유연함' },
            ].map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.optionButton,
                  formData.lifestyle === o.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, lifestyle: o.value })}
              >
                <Text style={styles.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>성향</Text>
          <View style={styles.optionsContainer}>
            {[
              { value: 'introvert', label: '내향적' },
              { value: 'extrovert', label: '외향적' },
              { value: 'none', label: '상관없음' },
            ].map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.optionButton,
                  formData.personality === o.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, personality: o.value })}
              >
                <Text style={styles.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>흡연</Text>
          <View style={styles.optionsContainer}>
            {[
              { value: 'impossible', label: '흡연불가' },
              { value: 'none', label: '상관없음' },
            ].map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.optionButton,
                  formData.smoking === o.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, smoking: o.value })}
              >
                <Text style={styles.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>코골이</Text>
          <View style={styles.optionsContainer}>
            {[
              { value: 'impossible', label: '코골이 불가' },
              { value: 'none', label: '상관없음' },
            ].map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.optionButton,
                  formData.snoring === o.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, snoring: o.value })}
              >
                <Text style={styles.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>반려동물</Text>
          <View style={styles.optionsContainer}>
            {[
              { value: 'possible', label: '가능' },
              { value: 'impossible', label: '불가능' },
              { value: 'none', label: '상관없음' },
            ].map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.optionButton,
                  formData.pets === o.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, pets: o.value })}
              >
                <Text style={styles.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  /** ─── Step 3: 방 보유 여부 ─── */
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>방 정보</Text>
        <Text style={styles.stepSubtitle}>현재 방 상황을 알려주세요</Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>방 여부</Text>
          <View style={styles.optionsContainer}>
            {[
              { value: 'has', label: '방이 있어요', desc: '현재 방이 있고 룸메이트를 구해요', icon: 'home' },
              { value: 'none', label: '함께 방을 찾아요', desc: '룸메이트와 함께 방을 구해요', icon: 'search' },
            ].map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.optionButton,
                  formData.hasRoom === o.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, hasRoom: o.value })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Ionicons name={o.icon as any} size={20} color={formData.hasRoom === o.value ? '#F7B32B' : '#6b7280'} />
                  <Text style={styles.optionText}>{o.label}</Text>
                </View>
                <Text style={[styles.optionText, { fontSize: 12, color: '#6b7280', marginTop: 4 }]}>{o.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  /** ─── Step 4: 주소/좌표 + 이미지 추가 ─── */
const renderStep4 = () => (
  <View style={styles.stepContainer}>
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>상세 설명</Text>
      <Text style={styles.stepSubtitle}>
        {formData.hasRoom === 'has' ? '방 주소를 검색해 주세요' : '희망 지역을 입력해 주세요'}
      </Text>
    </View>

    <View style={styles.addressContainer}>
      {formData.hasRoom === 'has' ? (
        // ✅ 방이 있는 경우: 주소 검색 버튼 + 입력
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>주소</Text>
          {/* <Input
            placeholder="방 주소를 입력하거나 검색 버튼으로 선택"
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })} // ✅ 실제로 상태 업데이트
          /> */}
          <TouchableOpacity
          onPress={() => setShowAddressModal(true)}
          style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: (selectedAddress || formData.address) ? '#000' : '#9ca3af' }}>
            {selectedAddress || formData.address || '주소를 검색해주세요'}
          </Text>
          <Ionicons name="search" size={16} color="#9ca3af" />
        </TouchableOpacity>
        </View>
      ) : (
        // ✅ 함께 방을 찾는 경우: 자유 입력
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>주소</Text>
          {/* <Input
            placeholder="방 주소를 입력하거나 검색 버튼으로 선택"
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })} // ✅ 실제로 상태 업데이트
          /> */}
          <TouchableOpacity
          onPress={() => setShowAddressModal(true)}
          style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: (selectedAddress || formData.address) ? '#000' : '#9ca3af' }}>
            {selectedAddress || formData.address || '주소를 검색해주세요'}
          </Text>
          <Ionicons name="search" size={16} color="#9ca3af" />
        </TouchableOpacity>
        </View>
      )}
    </View>

    {/* 이미지 업로드 부분*/}
    <View style={styles.formSection}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>이미지 업로드</Text>
          <Button onPress={pickImage}>
            <Text>이미지 선택</Text>
          </Button>
          <ScrollView horizontal style={{ flexDirection: 'row', marginTop: 10 }}>
            {selectedImages.map((image, index) => (
              <View key={index} style={{ position: 'relative', marginRight: 10 }}>
                <Image source={{ uri: image.uri }} style={{ width: 100, height: 100 }} />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 12,
                    padding: 2,
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

    {/* ✅ 주소 선택 모달 - 선택 시 formData.address도 업데이트 */}
    <AddressSearchModal
      visible={showAddressModal}
      onClose={() => setShowAddressModal(false)}
      onSelect={handleAddressSelect}
    />
  </View>
);


  /** ─── Step 5: 상세정보/ 추가정보 입력 ─── */
  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>상세 설명</Text>
        <Text style={styles.stepSubtitle}>구인글에 대한 상세 정보를 입력해주세요 (선택)</Text>
      </View>

      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{formData.hasRoom === 'has' ? '방 상세 정보' : '추가 정보'}</Text>
        <Text style={styles.stepSubtitle}>
          {formData.hasRoom === 'has' ? '방의 위치와 상세 정보를 입력해주세요' : '추가로 전달하고 싶은 내용을 작성해주세요'}
        </Text>
      </View>

      <View style={styles.fieldContainer}>
          <Text style={styles.label}>상세 설명 (detailDescription)</Text>
          <Input
            placeholder="추가로 알려주고 싶은 내용을 자유롭게 작성해주세요"
            value={formData.detailDescription}
            onChangeText={(t) => setFormData({ ...formData, detailDescription: t })}
            multiline
            style={{ height: 100, textAlignVertical: 'top' }}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>추가 설명 (additionalDescription)</Text>
          <Input
            placeholder="선택 입력"
            value={formData.additionalDescription}
            onChangeText={(t) => setFormData({ ...formData, additionalDescription: t })}
            multiline
            style={{ height: 80, textAlignVertical: 'top' }}
          />
        </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editJobId ? '구인글 수정' : '구인글 등록'}</Text>
          <View style={styles.spacer} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* 진행 상황(5단계) */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={[styles.progressDot, i + 1 <= step && styles.progressDotActive]} />
          ))}
        </View>

        {/* 현재 단계 */}
        {renderCurrentStep()}

        {/* 버튼 */}
        <View style={styles.nextButtonContainer}>
          <View style={styles.buttonRow}>
            {step > 1 && (
              <Button variant="outline" onPress={prevStep} style={styles.buttonFlex}>
                이전
              </Button>
            )}
            <Button 
              onPress={() => {
                console.log('Button pressed, step:', step, 'isValid:', isStepValid(), 'disabled:', step !== totalSteps && !isStepValid());
                nextStep();
              }} 
              disabled={step !== totalSteps && !isStepValid()} 
              style={step > 1 ? styles.buttonFlex : undefined}
            >
              {step === totalSteps ? '완료' : '다음'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}