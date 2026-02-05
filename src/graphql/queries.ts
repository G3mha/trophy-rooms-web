import { gql } from "@apollo/client";

// Game fragments
export const GAME_FRAGMENT = gql`
  fragment GameFields on Game {
    id
    title
    description
    coverUrl
    platform {
      id
      name
      slug
    }
    achievementSetCount
    achievementCount
    trophyCount
    createdAt
    updatedAt
  }
`;

export const ACHIEVEMENT_SET_FRAGMENT = gql`
  fragment AchievementSetFields on AchievementSet {
    id
    title
    type
    visibility
    createdByUserId
    achievementCount
    game {
      id
      title
    }
    createdAt
    updatedAt
  }
`;

export const GAME_WITH_ACHIEVEMENTS_FRAGMENT = gql`
  fragment GameWithAchievements on Game {
    ...GameFields
    achievementSets {
      id
      title
      type
      visibility
      createdByUserId
      achievements {
        id
        title
        description
        iconUrl
        points
        isCompleted
        userCount
        achievementSetId
      }
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
    points
    achievementSetId
    isCompleted
    userCount
    createdAt
    updatedAt
    achievementSet {
      id
      title
      type
      visibility
      createdByUserId
      game {
        id
        title
      }
    }
  }
`;

// User fragments
export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    name
    role
    achievementCount
    trophyCount
    gamesWithAchievementsCount
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

export const GET_ACHIEVEMENT_SETS = gql`
  query GetAchievementSets($gameId: ID, $visibility: AchievementSetVisibility, $type: AchievementSetType) {
    achievementSets(gameId: $gameId, visibility: $visibility, type: $type) {
      ...AchievementSetFields
    }
  }
  ${ACHIEVEMENT_SET_FRAGMENT}
`;

export const GET_MY_ACHIEVEMENT_SETS = gql`
  query GetMyAchievementSets {
    myAchievementSets {
      ...AchievementSetFields
    }
  }
  ${ACHIEVEMENT_SET_FRAGMENT}
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
            points
            achievementSet {
              id
              title
              game {
                id
                title
              }
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
