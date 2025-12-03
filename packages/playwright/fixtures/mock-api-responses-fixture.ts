import { test as base, type Page, type Route } from '@playwright/test';

type TMockRequest = { method: string; url: string };
type TMockResponse = { status: number; headers?: Record<string, string>; body?: unknown };
type THttpRestItem = {
  type: 'http-rest';
  request: TMockRequest;
  response: TMockResponse;
};

type TFixtures = {
  mockApiResponses: (data: unknown) => Promise<void>;
};

/**
 * 입력된 데이터가 유효한 HttpRestItem인지 확인하는 Type Guard
 */
const isValidMockItem = (item: unknown): item is THttpRestItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    typeof item.type === 'string' &&
    item.type === 'http-rest' &&
    'request' in item &&
    typeof item.request === 'object' &&
    item.request !== null &&
    'method' in item.request &&
    typeof item.request.method === 'string' &&
    'url' in item.request &&
    typeof item.request.url === 'string' &&
    'response' in item &&
    typeof item.response === 'object' &&
    item.response !== null &&
    'status' in item.response &&
    typeof item.response.status === 'number' &&
    'headers' in item.response &&
    typeof item.response.headers === 'object' &&
    'body' in item.response &&
    typeof item.response.body === 'object'
  );
};

/**
 * {param} 형태의 URL 패턴을 Playwright가 인식할 수 있는 정규식으로 변환합니다.
 */
const createUrlRegex = (urlPattern: string): RegExp => {
  const escapedPattern = urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 특수문자 이스케이프
  const regexPattern = escapedPattern.replace(/\\{[^}]+\\}/g, '[^/]+'); // {param} -> [^/]+ (슬래시 제외 모든 문자)
  return new RegExp(`^${regexPattern}$`);
};

/**
 * 데이터를 'Method::URL' 키 기준으로 그룹화합니다.
 */
const groupResponsesByKey = (data: THttpRestItem[]) => {
  return data.reduce((acc, item) => {
    const key = `${item.request.method}::${item.request.url}`;
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key)?.push(item.response);
    return acc;
  }, new Map<string, TMockResponse[]>());
};


/**
 * 특정 Route에 대한 요청 처리 핸들러를 생성합니다.
 * Closure를 사용하여 호출 횟수(callCount) 상태를 관리합니다.
 */
const createRouteHandler = (responses: TMockResponse[]) => {
  let callCount = 0;

  return async (route: Route) => {
    const response = responses[callCount] || responses[responses.length - 1];

    if (callCount < responses.length) callCount++;

    await route.fulfill({
      status: response.status,
      headers: response.headers,
      body: response.body ? JSON.stringify(response.body) : undefined,
    });
  };
};

/**
 * 페이지에 모킹 라우트를 등록합니다.
 */
const registerMockRoutes = async (page: Page, mockData: unknown) => {
  if (!Array.isArray(mockData)) {
    throw new Error('Mock data must be an array');
  }

  const validItems = mockData.filter(isValidMockItem);

  const responseMap = groupResponsesByKey(validItems);

  const routePromises = Array.from(responseMap.entries()).map(async ([key, responses]) => {
    const [method, urlPattern] = key.split('::');
    const urlRegex = createUrlRegex(urlPattern);
    const handler = createRouteHandler(responses);

    await page.route(
      url => urlRegex.test(url.href),
      async route => {
        if (route.request().method() === method) {
          await handler(route);
        } else {
          await route.fallback();
        }
      },
    );
  });

  await Promise.all(routePromises);
};

export const mockApiResponsesTest = base.extend<TFixtures>({
  mockApiResponses: async ({ page }, use) => {
    await use(async (data: unknown) => {
      await registerMockRoutes(page, data);
    });
  },
});
