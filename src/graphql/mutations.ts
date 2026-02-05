import { gql } from "@apollo/client";
import {
  GAME_FRAGMENT,
  ACHIEVEMENT_FRAGMENT,
  ACHIEVEMENT_SET_FRAGMENT,
} from "./queries";

// Game mutations
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

// Achievement mutations
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

// Achievement Set mutations
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

export const PUBLISH_ACHIEVEMENT_SET = gql`
  mutation PublishAchievementSet($id: ID!) {
    publishAchievementSet(id: $id) {
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

// User achievement mutations
export const MARK_ACHIEVEMENT_COMPLETE = gql`
  mutation MarkAchievementComplete($achievementId: ID!) {
    markAchievementComplete(achievementId: $achievementId) {
      success
      userAchievement {
        id
        createdAt
        achievement {
          id
          title
          isCompleted
          userCount
        }
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const UNMARK_ACHIEVEMENT_COMPLETE = gql`
  mutation UnmarkAchievementComplete($achievementId: ID!) {
    unmarkAchievementComplete(achievementId: $achievementId) {
      success
      error {
        code
        message
        field
      }
    }
  }
`;
