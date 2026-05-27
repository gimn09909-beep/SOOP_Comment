
export const parser = new DOMParser();
export const decodeEntities = (text: string) => { if (!text) return ''; const doc = parser.parseFromString(text, 'text/html'); return doc.documentElement.textContent || ''; };

export const CONTENT_REGEX = /((?:https?:\/\/[^\s]+)|(?:\/[\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9?!]+(?:_s)?\/))/g;
export const PREVIEW_REGEX_1 = /(https?:\/\/[^\s]+)/g;
export const PREVIEW_REGEX_2 = /\/[\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9?!]+(?:_s)?\//g;
export const SMALL_MAP: Record<string, string> = { 'ㄱㅇㅇ': '205', 'ㅋ': '206', 'ㅎㅇ': '207', 'ㅂㅇ': '208', 'ㅠㅠ': '209', 'ㄷㄷ': '210', 'ㅇㅈ': '211', 'ㄴㅇㅈ': '212', 'ㅊㅋ': '213', 'ㄱㄱ': '214', 'ㅅㄱ': '215', 'ㅈㅅ': '216', 'ㅗㅜㅑ': '217', 'ㅗ': '218', 'ㅂㄷㅂㄷ': '219', 'ㄲㅂ': '220', '댄스': '221', '문열어': '222', 'ㄴㅇㅂㅈ': '223', 'ㄹㅇ': '224', 'ㅈㅁ': '225', 'ㅈㄱ': '226', 'ㅈㅂ': '227', '쉿': '228', '냠냠': '229', '졸려': '230' };

export interface Token { type: 'text' | 'link' | 'emoticon'; value: string; isSmall?: boolean; id?: string; }

export const tokenizeContent = (text: string): { tokens: Token[], preview: string } => {
  const d = decodeEntities(text);
  const preview = d.replace(PREVIEW_REGEX_1, ' ').replace(PREVIEW_REGEX_2, ' ').replace(/\s+/g, ' ').trim();
  const tokens: Token[] = d.split(CONTENT_REGEX).map(part => {
    if (part.startsWith('http')) return { type: 'link', value: part };
    if (part.startsWith('/') && part.endsWith('/')) {
      const isSmall = part.includes('_s/');
      const name = isSmall ? part.slice(1, -3) : part.slice(1, -1);
      return { type: 'emoticon', value: name, isSmall, id: SMALL_MAP[name] };
    }
    return { type: 'text', value: part };
  });
  return { tokens, preview };
};

export const CLASSIC_EMOTICONS: Record<string, string> = { 'ㅠㅠ': 'cry', 'ㅋㅋ': 'laugh', 'ㅎㅎ': 'smile', '우와': 'wow', '굿': 'good', '??': 'question', '!!': 'exclamation', '하트': 'heart', '별': 'star', '응원': 'cheer', '박수': 'clap', '절': 'bow', '먹방': 'mukbang', '최고': 'best' };

export const getClassicName = (name: string) => {
  for (const kr in CLASSIC_EMOTICONS) if (name.startsWith(kr)) return CLASSIC_EMOTICONS[kr] + name.slice(kr.length);
  return name;
};
