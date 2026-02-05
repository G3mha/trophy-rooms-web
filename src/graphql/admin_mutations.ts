import { gql } from "@apollo/client";
import { PLATFORM_FRAGMENT } from "./admin_queries";
import {
  GAME_FRAGMENT,
  ACHIEVEMENT_SET_FRAGMENT,
  ACHIEVEMENT_FRAGMENT,
  USER_FRAGMENT,
} from "./queries";

export const CREATE_PLATFORM = gql`
  mutation CreatePlatform($input: CreatePlatformInput!) {
    createPlatform(input: $input) {
      success
      platform {
        ...PlatformFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${PLATFORM_FRAGMENT}
`;

export const UPDATE_PLATFORM = gql`
  mutation UpdatePlatform($id: ID!, $input: UpdatePlatformInput!) {
    updatePlatform(id: $id, input: $input) {
      success
      platform {
        ...PlatformFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${PLATFORM_FRAGMENT}
`;

export const DELETE_PLATFORM = gql`
  mutation DeletePlatform($id: ID!) {
    deletePlatform(id: $id) {
      success
      platform {
        id
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_GAME = gql`
  mutation CreateGame($input: CreateGameInput!) {
    createGame(input: $input) {
      success
      game {
        ...GameFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${GAME_FRAGMENT}
`;

export const UPDATE_GAME = gql`
  mutation UpdateGame($id: ID!, $input: UpdateGameInput!) {
    updateGame(id: $id, input: $input) {
      success
      game {
        ...GameFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${GAME_FRAGMENT}
`;

export const DELETE_GAME = gql`
  mutation DeleteGame($id: ID!) {
    deleteGame(id: $id) {
      success
      deletedId
      error {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_ACHIEVEMENT_SET = gql`
  mutation CreateAchievementSet($input: CreateAchievementSetInput!) {
    createAchievementSet(input: $input) {
      success
      achievementSet {
        ...AchievementSetFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${ACHIEVEMENT_SET_FRAGMENT}
`;

export const UPDATE_ACHIEVEMENT_SET = gql`
  mutation UpdateAchievementSet($id: ID!, $input: UpdateAchievementSetInput!) {
    updateAchievementSet(id: $id, input: $input) {
      success
      achievementSet {
        ...AchievementSetFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${ACHIEVEMENT_SET_FRAGMENT}
`;

export const DELETE_ACHIEVEMENT_SET = gql`
  mutation DeleteAchievementSet($id: ID!) {
    deleteAchievementSet(id: $id) {
      success
      achievementSet {
        id
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_ACHIEVEMENT = gql`
  mutation CreateAchievement($input: CreateAchievementInput!) {
    createAchievement(input: $input) {
      success
      achievement {
        ...AchievementFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${ACHIEVEMENT_FRAGMENT}
`;

export const UPDATE_ACHIEVEMENT = gql`
  mutation UpdateAchievement($id: ID!, $input: UpdateAchievementInput!) {
    updateAchievement(id: $id, input: $input) {
      success
      achievement {
        ...AchievementFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${ACHIEVEMENT_FRAGMENT}
`;

export const DELETE_ACHIEVEMENT = gql`
  mutation DeleteAchievement($id: ID!) {
    deleteAchievement(id: $id) {
      success
      achievement {
        id
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const SET_USER_ROLE = gql`
  mutation SetUserRole($userId: ID!, $role: UserRole!) {
    setUserRole(userId: $userId, role: $role) {
      success
      user {
        ...UserFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const BULK_CREATE_ACHIEVEMENTS = gql`
  mutation BulkCreateAchievements($achievementSetId: ID!, $achievements: [BulkAchievementInput!]!) {
    bulkCreateAchievements(achievementSetId: $achievementSetId, achievements: $achievements) {
      success
      createdCount
      skippedCount
      error {
        code
        message
        field
      }
    }
  }
`;
