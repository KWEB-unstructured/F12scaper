// 담당: 김씨 · 닉네임 검사. api/ 함수에서만 쓴다 (_lib 은 라우트가 아니다).

// 목록은 정규화된 형태(공백·기호 없이, 소문자)로 적는다.
const BANNED = [
  // 여기에 단어를 채운다
  '시발', '씨발', '개새끼', '지랄', '병신', 'fuck', 'bitch', 'shit'
];

/** 검사용으로만 쓴다: 소문자로 바꾸고, 한글·영문 말고는 전부 지운다. */
function normalize(text) {
  return text.toLowerCase().replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z]/g, '');
}

/** 보이지 않는 문자(제어 문자, 폭 없는 공백 등)가 있으면 true */
export function hasInvisibleChar(text) {
  return /\p{C}/u.test(text);
}

/** 비속어가 들어 있으면 true */
export function hasProfanity(text) {
  // ① text 를 normalize 한 값을 만든다
    const norm_text = normalize(text);
  // ② BANNED 중 하나라도 그 값에 "포함"되면 true
    return BANNED.some((word) => norm_text.includes(word));
}
