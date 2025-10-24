export enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  None = "NONE",
}

export enum Lifestyle {
  Morning = "MORNING",
  Evening = "EVENING",
}

export enum Personality {
  Introvert = 'INTROVERT',
  Extrovert = 'EXTROVERT',
}

export enum MatchStatus {
  OnWait = 'ON_WAIT',
  Matching = 'MATCHING',
  Matched = 'MATCHED',
  Rejected = 'REJECTED',
}

export enum RecruitStatus {
    Recruiting = 'RECRUITING',
    OnContact = 'ON_CONTACT',
    RecruitOver = 'RECRUIT_OVER'
}

export enum SocialType {
    Kakao = 'KAKAO'
}

export enum MessageType {
    Text = 'TEXT', 
    Image = 'IMAGE'
}

export enum AlarmType {
    Comment = 'COMMENT',
    Chat = 'CHAT',
    ChatInvited = 'INVITED',
    NewApply = 'NEW_APPLY',
    StartMatching = 'START_MATCHING',  // 초대 보내기 
    MatchComplete = 'MATCH_COMPLETE'
}

export enum AlarmSourceType {
  COMMENT = 'COMMENT', 
  CHATROOM = 'CHATROOM', 
  RECRUIT_POST = 'RECRUIT_POST'
}
