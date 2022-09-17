import { BadRequestError } from "../expressError";
import { CompanyFilters } from "../models/company";

interface JobFilters {
  title?: string;
  minSalary?: number;
  hasEquity?: boolean;
}

interface FilterMaps {
  [key: string]: string;
}

/** Convert JS object to SQL string and value array for parameterized entry
 *
 *  Returns { setCols: '"column_one"=$1, "column_two"=$2...', values: any[] }
 *
 * Takes a JS object and an object to SQL column name mapping
 *
 * Throws BadRequestError if an object is not entered
 *
 * */

function sqlForPartialUpdate(
  dataToUpdate: Object,
  jsToSql: { [key: string]: number | string }
): { setCols: string; values: any[] } {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Convert JS object to string for filtering SQL queries
 *
 * Returns { str: 'WHERE "column_one"=$1 and "column_two" < $2 ...', values: any[] }
 *
 * Takes a JS object and an object to filter mapping
 *
 * */

function sqlForFilters(
  filters: CompanyFilters | JobFilters,
  mapping: FilterMaps
): { str: string; values: any[] } {
  const keys = Object.keys(filters);
  const filterString = keys
    .map((filterName, idx) => `${mapping[filterName]} $${idx + 1}`)
    .join(" and ");
  // Put '%' around any strings so ILIKE works
  const values = Object.values(filters).map((value) =>
    typeof value === "string" ? `%${value}%` : value
  );
  return {
    str: `WHERE ${filterString}`,
    values: values,
  };
}

export { sqlForPartialUpdate, sqlForFilters };
