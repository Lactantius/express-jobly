import { sqlForPartialUpdate } from "../../src/helpers/sql";

describe("sqlForPartialUpdate", () => {
  test("converts JSON for better db entry", () => {
    const data = { camelCase: "text", moreCamelCase: 50 };
    const mapping = {
      camelCase: "snake_case",
      moreCamelCase: "more_snake_case",
    };
    const dbReady = sqlForPartialUpdate(data, mapping);
    expect(dbReady).toEqual({
      //setCols: ['"snake_case"=$1', '"more_snake_case"=$2'],
      setCols: '"snake_case"=$1, "more_snake_case"=$2',
      values: ["text", 50],
    });
  });
});
