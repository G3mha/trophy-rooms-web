import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
  documents: ["src/**/*.tsx", "src/**/*.ts", "!src/generated/**/*"],
  generates: {
    "./src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        scalars: {
          DateTime: "string",
        },
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
