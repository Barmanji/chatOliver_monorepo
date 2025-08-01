import { configureStore } from '@reduxjs/toolkit'
import authReducer from  './slices/auth/authSlice'

export const store = configureStore({
    reducer:{
        auth: authReducer,
    }
  // reducer: {
  //   posts: postsReducer,
  //   comments: commentsReducer,
  //   users: usersReducer,
  // },
})

// NOTE: To fix typesafety and make TS happy, these things below
//
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
