import { gql } from "@apollo/client";
import {
  GAME_FRAGMENT,
  ACHIEVEMENT_SET_FRAGMENT,
  ACHIEVEMENT_FRAGMENT,
  USER_FRAGMENT,
} from "./queries";

// Platform fragments
export const PLATFORM_FRAGMENT = gql`
  fragment PlatformFields on Platform {
    id
    name
    slug
    gameCount
    createdAt
    updatedAt
  }
`;

// Queries
export const GET_PLATFORMS = gql`
  query GetPlatforms {
    platforms {
      ...PlatformFields
    }
  }
  ${PLATFORM_FRAGMENT}
`;

export const GET_GAMES_ADMIN = gql`
  query GetGamesAdmin($first: Int, $after: String, $orderBy: GameOrderBy) {
    games(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        cursor
        node {
          ...GameFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${GAME_FRAGMENT}
`;

export const GET_ACHIEVEMENT_SETS_ADMIN = gql`
  query GetAchievementSetsAdmin($gameId: ID, $type: AchievementSetType, $visibility: AchievementSetVisibility) {
    achievementSets(gameId: $gameId, type: $type, visibility: $visibility) {
      ...AchievementSetFields
    }
  }
  ${ACHIEVEMENT_SET_FRAGMENT}
`;

export const GET_ACHIEVEMENTS_ADMIN = gql`
  query GetAchievementsAdmin($first: Int, $after: String, $filter: AchievementsFilterInput, $orderBy: AchievementOrderBy) {
    achievements(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        cursor
        node {
          ...AchievementFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${ACHIEVEMENT_FRAGMENT}
`;

export const GET_USERS_ADMIN = gql`
  query GetUsersAdmin($first: Int, $after: String, $search: String) {
    users(first: $first, after: $after, search: $search) {
      edges {
        cursor
        node {
          ...UserFields
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${USER_FRAGMENT}
`;
