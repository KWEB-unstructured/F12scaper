// Supabase 클라이언트 (서버 전용). service_role 키는 RLS 를 우회하므로 절대 브라우저 코드로 가져가지 않는다.
import { createClient } from '@supabase/supabase-js';

let client = null;

/** 환경변수가 없으면 false → 각 API 가 개발용 mock 응답을 돌려준다. */
export function hasDb() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function db() {
  client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return client;
}
