import { describe, it, expect, vi, beforeAll } from "vitest";
import { HTTPRequest } from "../modules/classes/HTTPRequest";
import dotenv from "dotenv";

describe("HTTPRequest tests", () => {
  let requester: HTTPRequest;
  dotenv.config();

  beforeAll(() => {
    requester = new HTTPRequest("https://jsonplaceholder.typicode.com", 20000);
  });

  it("should be initialized", {}, () => {
    expect(requester).toBeInstanceOf(HTTPRequest);
  });

  it("should get data", {}, async () => {
    const result = await requester.get("/posts/1");

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBe(200);
  });

  it("should post data", {}, async () => {
    const body = {
      title: "foo",
      body: "bar",
      userId: 1,
    };
    const headers = {
      "Content-type": "application/json",
    };
    const result = await requester.post("/posts", body, headers);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBe(201);
  });

  it("should delete data", {}, async () => {
    const result = await requester.delete("/posts/1");

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBe(200);
  });

  it("should put data", {}, async () => {
    const body = {
      id: 1,
      title: "foo",
      body: "bar",
      userId: 1,
    };
    const headers = {
      "Content-type": "application/json",
    };
    const result = await requester.put("/posts/1", body, headers);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBe(200);
  });

  it("should patch data", {}, async () => {
    const body = {
      title: "foo",
    };
    const headers = {
      "Content-type": "application/json",
    };
    const result = await requester.patch("/posts/1", body, headers);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toBe(200);
  });
});
