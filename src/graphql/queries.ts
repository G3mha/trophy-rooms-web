import { gql } from "@apollo/client";

// Game fragments
export const GAME_FRAGMENT = gql`
  fragment GameFields on Game {
    id
    title
    description
    coverUrl
    releaseDate
    developer
    publisher
    genre
    esrbRating
    screenshots
    type
    baseGameId
    baseGame {
      id
      title
      coverUrl
    }
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
        tier
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
    tier
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
    createdAt
    stats {
      totalPoints
      goldCount
      silverCount
      bronzeCount
      completionRate
      averagePointsPerGame
    }
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
            tier
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

// Public profile queries
export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      achievementCount
      trophyCount
      gamesWithAchievementsCount
      createdAt
      stats {
        totalPoints
        goldCount
        silverCount
        bronzeCount
        completionRate
        averagePointsPerGame
      }
      recentAchievements {
        id
        createdAt
        achievement {
          id
          title
          tier
          points
          achievementSet {
            game {
              id
              title
            }
          }
        }
      }
    }
  }
`;

export const GET_USER_ACHIEVEMENTS = gql`
  query GetUserAchievements($userId: ID!, $first: Int, $after: String) {
    userAchievements(userId: $userId, first: $first, after: $after) {
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
            tier
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

export const GET_USER_TROPHIES = gql`
  query GetUserTrophies($userId: ID!, $first: Int, $after: String) {
    userTrophies(userId: $userId, first: $first, after: $after) {
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

// Leaderboard queries
export const GET_LEADERBOARD_BY_TROPHIES = gql`
  query GetLeaderboardByTrophies($limit: Int) {
    leaderboardByTrophies(limit: $limit) {
      rank
      userId
      userName
      userEmail
      value
      secondaryValue
    }
  }
`;

export const GET_LEADERBOARD_BY_ACHIEVEMENTS = gql`
  query GetLeaderboardByAchievements($limit: Int) {
    leaderboardByAchievements(limit: $limit) {
      rank
      userId
      userName
      userEmail
      value
      secondaryValue
    }
  }
`;

export const GET_LEADERBOARD_BY_POINTS = gql`
  query GetLeaderboardByPoints($limit: Int) {
    leaderboardByPoints(limit: $limit) {
      rank
      userId
      userName
      userEmail
      value
      secondaryValue
    }
  }
`;

export const GET_LEADERBOARD_BY_GAMES = gql`
  query GetLeaderboardByGames($limit: Int) {
    leaderboardByGamesPlayed(limit: $limit) {
      rank
      userId
      userName
      userEmail
      value
      secondaryValue
    }
  }
`;

export const GET_FASTEST_COMPLETIONS = gql`
  query GetFastestCompletions($limit: Int) {
    fastestCompletions(limit: $limit) {
      rank
      userId
      userName
      userEmail
      gameId
      gameTitle
      completionTimeHours
      completedAt
    }
  }
`;

// Activity feed queries
export const GET_ACTIVITY_FEED = gql`
  query GetActivityFeed($limit: Int) {
    activityFeed(limit: $limit) {
      id
      type
      userId
      userName
      userEmail
      achievementId
      achievementTitle
      achievementTier
      achievementPoints
      gameId
      gameTitle
      earnedAt
    }
  }
`;

export const GET_RECENT_ACHIEVEMENT_ACTIVITY = gql`
  query GetRecentAchievementActivity($limit: Int) {
    recentAchievementActivity(limit: $limit) {
      id
      userId
      userName
      userEmail
      achievementId
      achievementTitle
      achievementTier
      achievementPoints
      gameId
      gameTitle
      earnedAt
    }
  }
`;

export const GET_RECENT_TROPHY_ACTIVITY = gql`
  query GetRecentTrophyActivity($limit: Int) {
    recentTrophyActivity(limit: $limit) {
      id
      userId
      userName
      userEmail
      gameId
      gameTitle
      earnedAt
    }
  }
`;

// Game progress queries
export const GET_MY_GAME_PROGRESS = gql`
  query GetMyGameProgress {
    myGameProgress {
      gameId
      gameTitle
      gameCoverUrl
      earnedCount
      totalCount
      earnedPoints
      totalPoints
      percentComplete
      hasTrophy
      trophyEarnedAt
      lastActivityAt
    }
  }
`;

export const GET_USER_GAME_PROGRESS = gql`
  query GetUserGameProgress($userId: String!) {
    userGameProgress(userId: $userId) {
      gameId
      gameTitle
      gameCoverUrl
      earnedCount
      totalCount
      earnedPoints
      totalPoints
      percentComplete
      hasTrophy
      trophyEarnedAt
      lastActivityAt
    }
  }
`;

// Game status / library queries
export const GET_GAME_STATUS = gql`
  query GetGameStatus($gameId: ID!) {
    getGameStatus(gameId: $gameId) {
      status
      platformId
    }
  }
`;

export const GET_MY_GAMES_BY_STATUS = gql`
  query GetMyGamesByStatus($status: GameStatus) {
    myGamesByStatus(status: $status) {
      id
      gameId
      gameTitle
      gameCoverUrl
      gameDescription
      achievementCount
      platformId
      platformName
      platformSlug
      status
      addedAt
      updatedAt
    }
  }
`;

export const GET_LIBRARY_COUNT = gql`
  query GetLibraryCount {
    libraryCount
  }
`;

export const GET_LIBRARY_COUNT_BY_STATUS = gql`
  query GetLibraryCountByStatus($status: GameStatus!) {
    libraryCountByStatus(status: $status)
  }
`;

// Collection fragments
export const COLLECTION_ITEM_FRAGMENT = gql`
  fragment CollectionItemFields on CollectionItem {
    id
    gameId
    game {
      id
      title
      coverUrl
    }
    platformId
    platform {
      id
      name
      slug
    }
    hasDisc
    hasBox
    hasManual
    hasExtras
    isSealed
    region
    notes
    createdAt
    updatedAt
  }
`;

// Collection queries
export const GET_MY_COLLECTION = gql`
  query GetMyCollection($region: GameRegion, $isSealed: Boolean, $isComplete: Boolean) {
    myCollection(region: $region, isSealed: $isSealed, isComplete: $isComplete) {
      ...CollectionItemFields
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
`;

export const GET_MY_COLLECTION_FOR_GAME = gql`
  query GetMyCollectionForGame($gameId: ID!) {
    myCollectionForGame(gameId: $gameId) {
      ...CollectionItemFields
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
`;

export const GET_COLLECTION_STATS = gql`
  query GetCollectionStats {
    collectionStats {
      totalItems
      sealedCount
      completeCount
      byRegion {
        region
        count
      }
    }
  }
`;

export const GET_COLLECTION_COUNT = gql`
  query GetCollectionCount {
    collectionCount
  }
`;

// Buylist fragments
export const BUYLIST_ITEM_FRAGMENT = gql`
  fragment BuylistItemFields on BuylistItem {
    id
    userId
    gameId
    game {
      id
      title
      coverUrl
      platform {
        id
        name
        slug
      }
    }
    gameVersionId
    gameVersion {
      id
      name
    }
    dlcId
    dlc {
      id
      name
      effectiveCoverUrl
      game {
        id
        title
      }
    }
    bundleId
    bundle {
      id
      name
      coverUrl
    }
    priority
    notes
    estimatedPrice
    itemType
    displayTitle
    displayCoverUrl
    addedAt
    updatedAt
  }
`;

// Buylist queries
export const GET_MY_BUYLIST = gql`
  query GetMyBuylist($filter: BuylistFilterInput, $orderBy: BuylistOrderBy) {
    myBuylist(filter: $filter, orderBy: $orderBy) {
      ...BuylistItemFields
    }
  }
  ${BUYLIST_ITEM_FRAGMENT}
`;

export const GET_USER_BUYLIST = gql`
  query GetUserBuylist($userId: ID!, $filter: BuylistFilterInput, $orderBy: BuylistOrderBy) {
    userBuylist(userId: $userId, filter: $filter, orderBy: $orderBy) {
      ...BuylistItemFields
    }
  }
  ${BUYLIST_ITEM_FRAGMENT}
`;

export const GET_BUYLIST_STATS = gql`
  query GetBuylistStats {
    buylistStats {
      totalItems
      totalEstimatedCost
      highPriorityCount
      mediumPriorityCount
      lowPriorityCount
      gameCount
      dlcCount
      bundleCount
    }
  }
`;

export const IS_IN_BUYLIST = gql`
  query IsInBuylist($gameId: ID, $dlcId: ID, $bundleId: ID) {
    isInBuylist(gameId: $gameId, dlcId: $dlcId, bundleId: $bundleId)
  }
`;

// Games by title query - for game family page
export const GET_GAMES_BY_TITLE = gql`
  query GetGamesByTitle($title: String!) {
    gamesByTitle(title: $title) {
      id
      title
      description
      coverUrl
      achievementCount
      trophyCount
      platform {
        id
        name
        slug
      }
    }
  }
`;
