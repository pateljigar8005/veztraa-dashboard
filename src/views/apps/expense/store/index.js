import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appExpenses/getAllData', async () => {
  const response = await axios.get('/expenses', { params: { perPage: 100 } })
  return response.data.data.expenses
})

export const getData = createAsyncThunk('appExpenses/getData', async params => {
  const response = await axios.get('/expenses', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      q: params.q || '',
      sortColumn: params.sortColumn || 'id',
      sortDirection: params.sort || 'desc',
      ...params.filters
    }
  })
  return {
    params,
    data: response.data.data.expenses,
    totalPages: response.data.data.total
  }
})

export const getExpense = createAsyncThunk('appExpenses/getExpense', async id => {
  const response = await axios.get(`/expenses/${id}`)
  return response.data.data
})

export const addExpense = createAsyncThunk('appExpenses/addExpense', async (expense, { dispatch, getState }) => {
  const response = await axios.post('/expenses', expense)
  await dispatch(getData(getState().expenses.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateExpense = createAsyncThunk(
  'appExpenses/updateExpense',
  async ({ id, ...expense }, { dispatch, getState }) => {
    const response = await axios.put(`/expenses/${id}`, expense)
    await dispatch(getData(getState().expenses.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteExpense = createAsyncThunk('appExpenses/deleteExpense', async (id, { dispatch, getState }) => {
  try {
    await axios.delete(`/expenses/${id}`)
    await dispatch(getData(getState().expenses.params))
    await dispatch(getAllData())
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const getExpenseAttachments = createAsyncThunk('appExpenses/getExpenseAttachments', async expenseId => {
  const response = await axios.get(`/expenses/${expenseId}/attachments`)
  return response.data.data.attachments
})

export const uploadExpenseAttachment = createAsyncThunk(
  'appExpenses/uploadExpenseAttachment',
  async ({ expenseId, file }) => {
    const formData = new FormData()
    formData.append('attachment', file)
    const response = await axios.post(`/expenses/${expenseId}/attachments`, formData)
    return response.data.data
  }
)

export const deleteExpenseAttachment = createAsyncThunk('appExpenses/deleteExpenseAttachment', async id => {
  await axios.delete(`/expense-attachments/${id}`)
  return id
})

export const appExpensesSlice = createSlice({
  name: 'appExpenses',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedExpense: null,
    attachments: []
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getAllData.fulfilled, (state, action) => {
        state.allData = action.payload
      })
      .addCase(getData.fulfilled, (state, action) => {
        state.data = action.payload.data
        state.params = action.payload.params
        state.total = action.payload.totalPages
      })
      .addCase(getExpense.fulfilled, (state, action) => {
        state.selectedExpense = action.payload
      })
      .addCase(getExpenseAttachments.fulfilled, (state, action) => {
        state.attachments = action.payload
      })
      .addCase(uploadExpenseAttachment.fulfilled, (state, action) => {
        state.attachments = [action.payload, ...state.attachments]
      })
      .addCase(deleteExpenseAttachment.fulfilled, (state, action) => {
        state.attachments = state.attachments.filter(a => a.id !== action.payload)
      })
  }
})

export default appExpensesSlice.reducer
