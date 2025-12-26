import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
  credentials: "include",
});

// Error handling link
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

// Auth link - adds token to requests
const authLink = setContext(async (_, { headers }) => {
  // Get token from Clerk on client side
  let token: string | null = null;

  if (typeof window !== "undefined") {
    // Dynamic import to avoid SSR issues
    try {
      const { useAuth } = await import("@clerk/nextjs");
      // Note: This won't work directly - we need to use the provider approach
      // Token will be injected via ApolloWrapper
    } catch {
      // Clerk not available
    }
  }

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Create Apollo Client for SSR (without auth)
export function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: from([errorLink, httpLink]),
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

// Singleton for client-side
let apolloClient: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (typeof window === "undefined") {
    return createApolloClient();
  }

  if (!apolloClient) {
    apolloClient = createApolloClient();
  }

  return apolloClient;
}
