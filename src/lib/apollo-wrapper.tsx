"use client";

import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

function createApolloClientWithAuth(getToken: () => Promise<string | null>) {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    credentials: "include",
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}, Code: ${extensions?.code}`
        );
      });
    }
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  const authLink = setContext(async (_, { headers }) => {
    const token = await getToken();

    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            games: {
              keyArgs: ["filter", "orderBy"],
              merge(existing, incoming, { args }) {
                if (!args?.after) {
                  return incoming;
                }
                return {
                  ...incoming,
                  edges: [...(existing?.edges || []), ...incoming.edges],
                };
              },
            },
            achievements: {
              keyArgs: ["filter", "orderBy"],
              merge(existing, incoming, { args }) {
                if (!args?.after) {
                  return incoming;
                }
                return {
                  ...incoming,
                  edges: [...(existing?.edges || []), ...incoming.edges],
                };
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
    },
  });
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  const client = useMemo(() => {
    return createApolloClientWithAuth(getToken);
  }, [getToken]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
