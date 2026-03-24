import { gql } from "@apollo/client";
import { PLATFORM_FRAGMENT, GAME_VERSION_FRAGMENT, DLC_FRAGMENT, BUNDLE_FRAGMENT } from "./admin_queries";
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

export const BULK_DELETE_PLATFORMS = gql`
  mutation BulkDeletePlatforms($ids: [ID!]!) {
    bulkDeletePlatforms(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

export const BULK_DELETE_GAMES = gql`
  mutation BulkDeleteGames($ids: [ID!]!) {
    bulkDeleteGames(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

export const CLONE_GAME_TO_PLATFORM = gql`
  mutation CloneGameToPlatform($gameId: ID!, $targetPlatformId: ID!, $copyAchievementSets: Boolean) {
    cloneGameToPlatform(gameId: $gameId, targetPlatformId: $targetPlatformId, copyAchievementSets: $copyAchievementSets) {
      success
      game {
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

export const BULK_DELETE_ACHIEVEMENT_SETS = gql`
  mutation BulkDeleteAchievementSets($ids: [ID!]!) {
    bulkDeleteAchievementSets(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

export const BULK_DELETE_ACHIEVEMENTS = gql`
  mutation BulkDeleteAchievements($ids: [ID!]!) {
    bulkDeleteAchievements(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

// Game Version mutations
export const CREATE_GAME_VERSION = gql`
  mutation CreateGameVersion($input: CreateGameVersionInput!) {
    createGameVersion(input: $input) {
      success
      gameVersion {
        ...GameVersionFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${GAME_VERSION_FRAGMENT}
`;

export const UPDATE_GAME_VERSION = gql`
  mutation UpdateGameVersion($id: ID!, $input: UpdateGameVersionInput!) {
    updateGameVersion(id: $id, input: $input) {
      success
      gameVersion {
        ...GameVersionFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${GAME_VERSION_FRAGMENT}
`;

export const DELETE_GAME_VERSION = gql`
  mutation DeleteGameVersion($id: ID!) {
    deleteGameVersion(id: $id) {
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

export const SET_DEFAULT_VERSION = gql`
  mutation SetDefaultVersion($id: ID!) {
    setDefaultVersion(id: $id) {
      success
      gameVersion {
        ...GameVersionFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${GAME_VERSION_FRAGMENT}
`;

export const BULK_DELETE_GAME_VERSIONS = gql`
  mutation BulkDeleteGameVersions($ids: [ID!]!) {
    bulkDeleteGameVersions(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

// DLC mutations
export const CREATE_DLC = gql`
  mutation CreateDLC($input: CreateDLCInput!) {
    createDLC(input: $input) {
      success
      dlc {
        ...DLCFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${DLC_FRAGMENT}
`;

export const UPDATE_DLC = gql`
  mutation UpdateDLC($id: ID!, $input: UpdateDLCInput!) {
    updateDLC(id: $id, input: $input) {
      success
      dlc {
        ...DLCFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${DLC_FRAGMENT}
`;

export const DELETE_DLC = gql`
  mutation DeleteDLC($id: ID!) {
    deleteDLC(id: $id) {
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

export const BULK_DELETE_DLCS = gql`
  mutation BulkDeleteDLCs($ids: [ID!]!) {
    bulkDeleteDLCs(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

export const ADD_DLC_TO_VERSION = gql`
  mutation AddDLCToVersion($dlcId: ID!, $versionId: ID!) {
    addDLCToVersion(dlcId: $dlcId, versionId: $versionId) {
      success
      dlc {
        id
        name
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const REMOVE_DLC_FROM_VERSION = gql`
  mutation RemoveDLCFromVersion($dlcId: ID!, $versionId: ID!) {
    removeDLCFromVersion(dlcId: $dlcId, versionId: $versionId) {
      success
      dlc {
        id
        name
      }
      error {
        code
        message
        field
      }
    }
  }
`;

// Bundle mutations
export const CREATE_BUNDLE = gql`
  mutation CreateBundle($input: CreateBundleInput!) {
    createBundle(input: $input) {
      success
      bundle {
        ...BundleFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${BUNDLE_FRAGMENT}
`;

export const UPDATE_BUNDLE = gql`
  mutation UpdateBundle($id: ID!, $input: UpdateBundleInput!) {
    updateBundle(id: $id, input: $input) {
      success
      bundle {
        ...BundleFields
      }
      error {
        code
        message
        field
      }
    }
  }
  ${BUNDLE_FRAGMENT}
`;

export const DELETE_BUNDLE = gql`
  mutation DeleteBundle($id: ID!) {
    deleteBundle(id: $id) {
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

export const BULK_DELETE_BUNDLES = gql`
  mutation BulkDeleteBundles($ids: [ID!]!) {
    bulkDeleteBundles(ids: $ids) {
      success
      deletedCount
      error {
        code
        message
        field
      }
    }
  }
`;

export const ADD_GAME_TO_BUNDLE = gql`
  mutation AddGameToBundle($gameId: ID!, $bundleId: ID!) {
    addGameToBundle(gameId: $gameId, bundleId: $bundleId) {
      success
      bundle {
        id
        name
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const REMOVE_GAME_FROM_BUNDLE = gql`
  mutation RemoveGameFromBundle($gameId: ID!, $bundleId: ID!) {
    removeGameFromBundle(gameId: $gameId, bundleId: $bundleId) {
      success
      bundle {
        id
        name
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const ADD_DLC_TO_BUNDLE = gql`
  mutation AddDLCToBundle($dlcId: ID!, $bundleId: ID!) {
    addDLCToBundle(dlcId: $dlcId, bundleId: $bundleId) {
      success
      bundle {
        id
        name
      }
      error {
        code
        message
        field
      }
    }
  }
`;

export const REMOVE_DLC_FROM_BUNDLE = gql`
  mutation RemoveDLCFromBundle($dlcId: ID!, $bundleId: ID!) {
    removeDLCFromBundle(dlcId: $dlcId, bundleId: $bundleId) {
      success
      bundle {
        id
        name
      }
      error {
        code
        message
        field
      }
    }
  }
`;
