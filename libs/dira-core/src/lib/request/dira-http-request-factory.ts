export interface DiraHttpRequestFactory {

  get request() : Request;

  get url() : string;

  get method() : string;

  get headers() : Headers;

  get queryParams() : URLSearchParams;

  get jsonBody() : Promise<any>;

  get stringBody() : Promise<string>;

  get formDataBody() : Promise<FormData>;

}