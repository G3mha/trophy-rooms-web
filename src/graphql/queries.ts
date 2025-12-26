import { gql } from "@apollo/client";

// Game fragments
export const GAME_FRAGMENT = gql`
  fragment GameFields on Game {
    id
    title
    description
    coverUrl
    achievementCount
    trophyCount
    createdAt
    updatedAt
  }
`;

export const GAME_WITH_ACHIEVEMENTS_FRAGMENT = gql`
  fragment GameWithAchievements on Game {
    ...GameFields
    achievements {
      id
      title
      description
      iconUrl
      isCompleted
      userCount
    }
  }
  ${GAME_FRAGMENT}
`;

// Achievement fragments
export const ACHIEVEMENT_FRAGMENT = gql`
  fragment AchievementFields on Achievement {
    id
    title
    description
    iconUrl
    gameId
    isCompleted
    userCount
    createdAt
    updatedAt
    game {
      id
      title
    }
  }
`;

// User fragments
export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    name
    achievementCount
    trophyCount
  }
`;

// Queries
export const GET_GAMES = gql`
  query GetGames($first: Int, $after: String, $filter: GamesFilterInput, $orderBy: GameOrderBy) {
    games(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        cursor
        node {
          ...GameFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${GAME_FRAGMENT}
`;

export const GET_GAME = gql`
  query GetGame($id: ID!) {
    game(id: $id) {
      ...GameWithAchievements
      trophies {
        id
        createdAt
        user {
          id
          name
          email
        }
      }
    }
  }
  ${GAME_WITH_ACHIEVEMENTS_FRAGMENT}
`;

export const GET_ACHIEVEMENTS = gql`
  query GetAchievements($first: Int, $after: String, $filter: AchievementsFilterInput, $orderBy: AchievementOrderBy) {
    achievements(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        cursor
        node {
          ...AchievementFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${ACHIEVEMENT_FRAGMENT}
`;

export const GET_ACHIEVEMENT = gql`
  query GetAchievement($id: ID!) {
    achievement(id: $id) {
      ...AchievementFields
    }
  }
  ${ACHIEVEMENT_FRAGMENT}
`;

export const GET_ME = gql`
  query GetMe {
    me {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_MY_STATS = gql`
  query GetMyStats {
    myStats {
      totalTrophies
      totalAchievements
      totalGamesPlayed
    }
  }
`;

export const GET_MY_ACHIEVEMENTS = gql`
  query GetMyAchievements($first: Int, $after: String) {
    myAchievements(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          createdAt
          achievement {
            id
            title
            description
            iconUrl
            game {
              id
              title
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_MY_TROPHIES = gql`
  query GetMyTrophies($first: Int, $after: String) {
    myTrophies(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          createdAt
          game {
            id
            title
            coverUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;
