import { gql } from "@apollo/client";
import {
  GAME_FRAGMENT,
  ACHIEVEMENT_SET_FRAGMENT,
  ACHIEVEMENT_FRAGMENT,
  USER_FRAGMENT,
} from "./queries";

// Platform Release fragments
export const PLATFORM_RELEASE_FRAGMENT = gql`
  fragment PlatformReleaseFields on PlatformRelease {
    id
    region
    releaseDate
  }
`;

// Platform fragments
export const PLATFORM_FRAGMENT = gql`
  fragment PlatformFields on Platform {
    id
    name
    slug
    description
    consolePictureUrl
    promotionalPictures
    releases {
      ...PlatformReleaseFields
    }
    gameCount
    createdAt
    updatedAt
  }
  ${PLATFORM_RELEASE_FRAGMENT}
`;

// GameVersion fragments
export const GAME_VERSION_FRAGMENT = gql`
  fragment GameVersionFields on GameVersion {
    id
    name
    slug
    description
    coverUrl
    effectiveCoverUrl
    releaseDate
    isDefault
    digitalOnly
    gameIds
    gameCount
    games {
      id
      title
      platform {
        id
        name
        slug
      }
    }
    dlcs {
      id
      name
      slug
      type
    }
    dlcCount
    achievementSetCount
    createdAt
    updatedAt
  }
`;

// DLC fragments
export const DLC_FRAGMENT = gql`
  fragment DLCFields on DLC {
    id
    name
    slug
    type
    description
    coverUrl
    effectiveCoverUrl
    releaseDate
    price
    gameFamilyId
    gameFamily {
      id
      title
      slug
    }
    achievementSetCount
    createdAt
    updatedAt
  }
`;

// Bundle fragments
export const BUNDLE_FRAGMENT = gql`
  fragment BundleFields on Bundle {
    id
    name
    slug
    type
    description
    coverUrl
    releaseDate
    price
    platform {
      id
      name
    }
    platformId
    gameCount
    dlcCount
    games {
      id
      title
    }
    dlcs {
      id
      name
      game {
        id
        title
      }
    }
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
  query GetGamesAdmin($first: Int, $after: String, $orderBy: GameOrderBy, $search: String) {
    games(first: $first, after: $after, orderBy: $orderBy, filter: { search: $search }) {
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
  query GetAchievementSetsAdmin($gameFamilyId: ID, $type: AchievementSetType, $visibility: AchievementSetVisibility) {
    achievementSets(gameFamilyId: $gameFamilyId, type: $type, visibility: $visibility) {
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

export const GET_GAME_VERSIONS = gql`
  query GetGameVersions($gameFamilyId: ID) {
    gameVersions(gameFamilyId: $gameFamilyId) {
      ...GameVersionFields
    }
  }
  ${GAME_VERSION_FRAGMENT}
`;

export const GET_GAME_VERSION = gql`
  query GetGameVersion($id: ID!) {
    gameVersion(id: $id) {
      ...GameVersionFields
    }
  }
  ${GAME_VERSION_FRAGMENT}
`;

// DLC queries
export const GET_DLCS = gql`
  query GetDLCs($gameFamilyId: ID!) {
    dlcs(gameFamilyId: $gameFamilyId) {
      ...DLCFields
    }
  }
  ${DLC_FRAGMENT}
`;

export const GET_DLC = gql`
  query GetDLC($id: ID!) {
    dlc(id: $id) {
      ...DLCFields
    }
  }
  ${DLC_FRAGMENT}
`;

// Bundle queries
export const GET_BUNDLES = gql`
  query GetBundles($type: BundleType) {
    bundles(type: $type) {
      ...BundleFields
    }
  }
  ${BUNDLE_FRAGMENT}
`;

export const GET_BUNDLE = gql`
  query GetBundle($id: ID!) {
    bundle(id: $id) {
      ...BundleFields
    }
  }
  ${BUNDLE_FRAGMENT}
`;
