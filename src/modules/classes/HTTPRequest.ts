import { Logger } from "./Logger";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import https from "https";
import { setupCache } from "axios-cache-interceptor";

type HTTP_Headers = { [key: string]: string };
type HTTP_Body = { [key: string]: any };
type HTTP_ResponseTuple = [number, any];

export class HTTPRequest {
  private readonly host: string;
  private readonly headers: HTTP_Headers;
  private readonly instance: AxiosInstance;
  private readonly user_agent: string;
  private readonly logger: Logger = new Logger();

  /**
   * Creates a new HTTP object.
   * @param {string} host - The host to perform the action
   * @param {number} timeout - The timeout of the requests
   */
  constructor(host: string, timeout: number = 20000) {
    this.host = host;
    this.user_agent = "Cryptofundtrader Utils/1.0";
    this.headers = {
      "User-Agent": this.user_agent,
    };
    const axiosPool = axios.create({
      baseURL: this.host,
      timeout: timeout,
      httpAgent: new https.Agent({ keepAlive: true }),
    });

    this.instance = setupCache(axiosPool, {
      methods: ["get", "post", "patch", "put", "delete"],
      ttl: 20000,
    });

    axiosRetry(this.instance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });

    this.instance.interceptors.request.use((request) => {
      const method = request.method ?? "UNKNOWN";
      this.logger.info(
        `Starting ${method.toUpperCase()} request to ${request.url}`
      );
      return request;
    });

    this.instance.interceptors.response.use(
      (response) => {
        this.logger.info(
          `Received ${response.status} response from ${response.config.url}`
        );
        return response;
      },
      (error) => {
        this.logger.error(
          `Error during request to ${error.config.url}: ${error.message}`
        );
        return Promise.reject(error);
      }
    );

    this.logger.info("HTTPRequest service is UP");
  }

  /**
   * Performs a GET request to a specific endpoint and with specific headers (optional)
   * @param {string} endpoint - The endpoint of the request
   * @param {Record<string, any>} params - Optional params to send in the query string
   * @param {HTTP_Headers} [headers] - Add custom headers (they will be added to the default ones)
   * @returns {Promise<HTTP_ResponseTuple>} - The first param is the request status code, the second one is the response data
   */
  get = async (
    endpoint: string,
    headers?: HTTP_Headers
  ): Promise<HTTP_ResponseTuple> => {
    return this.#request("GET", endpoint, undefined, headers);
  };

  /**
   * Performs a POST request to a specific endpoint and with specific headers (optional)
   * @param {string} endpoint - The endpoint of the request
   * @param {HTTP_Body} [body] - Add custom body
   * @param {HTTP_Headers} [headers] - Add custom headers (they will be added to the default ones)
   * @returns {Promise<HTTP_ResponseTuple>} - The first param is the request status code, the second one is the response data
   */
  post = async (
    endpoint: string,
    body: HTTP_Body = {},
    headers?: HTTP_Headers
  ): Promise<HTTP_ResponseTuple> => {
    return this.#request("POST", endpoint, body, headers);
  };

  /**
   * Performs a PUT request to a specific endpoint and with specific headers (optional)
   * @param {string} endpoint - The endpoint of the request
   * @param {HTTP_Body} [body] - Add custom body
   * @param {HTTP_Headers} [headers] - Add custom headers (they will be added to the default ones)
   * @returns {Promise<HTTP_ResponseTuple>} - The first param is the request status code, the second one is the response data
   */
  put = async (
    endpoint: string,
    body: HTTP_Body = {},
    headers?: HTTP_Headers
  ): Promise<HTTP_ResponseTuple> => {
    return this.#request("PUT", endpoint, body, headers);
  };

  /**
   * Performs a PATCH request to a specific endpoint and with specific headers (optional)
   * @param {string} endpoint - The endpoint of the request
   * @param {HTTP_Body} [body] - Add custom body
   * @param {HTTP_Headers} [headers] - Add custom headers (they will be added to the default ones)
   * @returns {Promise<HTTP_ResponseTuple>} - The first param is the request status code, the second one is the response data
   */
  patch = async (
    endpoint: string,
    body: HTTP_Body = {},
    headers?: HTTP_Headers
  ): Promise<HTTP_ResponseTuple> => {
    return this.#request("PATCH", endpoint, body, headers);
  };

  /**
   * Performs a DELETE request to a specific endpoint and with specific headers (optional)
   * @param {string} endpoint - The endpoint of the request
   * @param {HTTP_Headers} [headers] - Add custom headers (they will be added to the default ones)
   * @returns {Promise<HTTP_ResponseTuple>} - The first param is the request status code, the second one is the response data
   */
  delete = async (
    endpoint: string,
    headers?: HTTP_Headers
  ): Promise<HTTP_ResponseTuple> => {
    return this.#request("DELETE", endpoint, undefined, headers);
  };

  /**
   * Performs a REQUEST request to a specific endpoint and with specific headers (optional) - Used by all methods of the class
   * @private
   * @param {string} method - The HTTP method
   * @param {string} endpoint - The endpoint of the request
   * @param {HTTP_Body} [body] - Add custom body
   * @param {HTTP_Headers} [headers] - Add custom headers (they will be added to the default ones)
   * @returns {Promise<HTTP_ResponseTuple>} - The first param is the request status code, the second one is the response data
   */
  #request = async (
    method: string,
    endpoint: string,
    body?: HTTP_Body,
    headers?: HTTP_Headers
  ): Promise<HTTP_ResponseTuple> => {
    let requestHeaders = headers
      ? { ...this.headers, ...headers }
      : this.headers;
    let response_data = "DEFAULT_ERROR";
    let response_code = 500;

    await this.instance
      .request({
        method,
        url: endpoint,
        data: body,
        headers: requestHeaders,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
      .then((data) => {
        response_code = data.status ?? 500;
        response_data = data.data;
      })
      .catch((err) => {
        response_code = err.response?.status ?? 500;
        response_data = err.response?.code ?? err.message;
      });

    return [response_code, response_data];
  };

  /**
   * Retrieves the host URI of the instance
   * @returns {string} - The host URI
   */
  getUri = (): string => {
    return this.instance.getUri();
  };
}
