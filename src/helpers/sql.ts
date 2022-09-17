import { BadRequestError } from "../expressError";

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

interface CompanyFilters {
  minEmployees?: number;
  maxEmployees?: number;
  nameLike?: string;
}

interface JobFilters {
  title?: string;
  minSalary?: number;
  hasEquity?: boolean;
}

interface FilterMaps {
  [key: string]: string;
}

function sqlForFilters(
  //filters: CompanyFilters,
  filters: CompanyFilters | JobFilters,
  mapping: FilterMaps
): { str: string; values: any[] } {
  const keys = Object.keys(filters);
  const filterString = keys
    .map((filterName, idx) => `${mapping[filterName]} $${idx + 1}`)
    .join(" and ");
  return {
    str: `WHERE ${filterString}`,
    values: Object.values(filters),
  };
}

export { sqlForPartialUpdate, sqlForFilters };
