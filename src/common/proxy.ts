import axios from 'axios';
import { Context, Next } from 'koa';

interface ProxyOptions {
  host: string;
  map?: (path: string) => string;
  jar?: boolean;
}

export function createProxy(options: ProxyOptions) {
  return async (ctx: Context, next: Next) => {
    const targetPath = options.map ? options.map(ctx.path) : ctx.path;
    const targetUrl = `${options.host}${targetPath}${ctx.querystring ? '?' + ctx.querystring : ''}`;

    try {
      const response = await axios({
        url: targetUrl,
        method: ctx.method,
        headers: ctx.request.header,
        data: ctx.request.body,
        withCredentials: options.jar,
        validateStatus: () => true,
        responseType: 'arraybuffer',
        maxRedirects: 5,
      });

      Object.entries(response.headers).forEach(([name, value]) => {
        if (name !== 'transfer-encoding') {
          ctx.set(name, value as string);
        }
      });

      ctx.body = response.data;
      ctx.status = response.status;
    } catch (error) {
      ctx.status = 502;
      ctx.body = 'Proxy Error';
    }
  };
}
