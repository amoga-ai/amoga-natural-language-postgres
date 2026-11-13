"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { getSchemaDescription } from "@/lib/schema";
import { model } from "@/lib/openrouter";
import { runQuery } from "@/lib/db";
import { generateText, Output } from "ai";
import { z } from "zod";

export const generateQuery = async (input: string) => {
  "use server";
  try {
    const schema = await getSchemaDescription();
    const { output } = await generateText({
      model,
      system: `You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need from our business database.

The tables are in the "analytics" schema. Always write table names with the schema prefix, for example analytics.customers.

The schema is as follows:

${schema}

Only retrieval queries are allowed (SELECT). Never write INSERT, UPDATE, DELETE, or DDL.

Rules:
- Use customers.is_internal = false to exclude internal and test accounts when counting customers, subscriptions, or revenue.
- For "last month", use the previous calendar month relative to now().
- Return at most 500 rows. Add ORDER BY and LIMIT where it makes sense.
- EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART. There should always be at least two columns. If the user asks for a single number, return the number with its period as a second column.
- For "over time" questions, group by month.
- Use only the tables and columns listed in the schema above. Never invent table names, column names, or aliases that are not in the schema.
  Respond only with a JSON object.
`,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      output: Output.object({
        schema: z.object({
          query: z.string(),
        }),
      }),
    });
    return output.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const runGenerateSQLQuery = async (query: string) => {
  "use server";
  // Allow a single read-only statement: SELECT, or WITH ... SELECT.
  const normalized = query.trim().toLowerCase();
  const startsOk = normalized.startsWith("select") || normalized.startsWith("with");
  const writeWords = /\b(drop|delete|insert|update|alter|truncate|create|grant|revoke)\b/;
  if (!startsOk || writeWords.test(normalized)) {
    throw new Error("Only SELECT queries are allowed");
  }

  return (await runQuery(query)) as Result[];
};

export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          explanations: explanationsSchema,
        }),
      }),
      system: `You are a SQL (postgres) expert. Your job is to explain to the user a SQL query you wrote to retrieve the data they asked for.

When you explain, take a section of the query and explain it. Each "section" should be unique. For example, in "SELECT * FROM analytics.customers LIMIT 20", the sections could be "SELECT *", "FROM analytics.customers", "LIMIT 20".
If a section doesn't have any explanation, include it, but leave the explanation empty.    Respond only with a JSON object.
`,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
    });
    return output;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
) => {
  "use server";
  try {
    const { output: config } = await generateText({
      model,
      system: "You are a data visualization expert. Respond only with a JSON object.",
      prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
      For multiple groups use multi-lines.

      Here is an example complete config:
      export const chartConfig = {
        type: "pie",
        xKey: "month",
        yKeys: ["sales", "profit", "expenses"],
        colors: {
          sales: "#4CAF50",    // Green for sales
          profit: "#2196F3",   // Blue for profit
          expenses: "#F44336"  // Red for expenses
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
      output: Output.object({
        schema: configSchema,
      }),
    });

    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e) {
    // @ts-expect-error e.message is available on errors from the SDK
    console.error(e.message);
    // Keep the table even when no chart can be built.
    return { config: null };
  }
};