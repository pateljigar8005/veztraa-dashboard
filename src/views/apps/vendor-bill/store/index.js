import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const getAllData = createAsyncThunk('appVendorBills/getAllData', async () => {
  const response = await axios.get('/vendor-bills', { params: { perPage: 100 } })
  return response.data.data.vendorBills
})

export const getData = createAsyncThunk('appVendorBills/getData', async params => {
  const response = await axios.get('/vendor-bills', {
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
    data: response.data.data.vendorBills,
    totalPages: response.data.data.total
  }
})

export const getVendorBill = createAsyncThunk('appVendorBills/getVendorBill', async id => {
  const response = await axios.get(`/vendor-bills/${id}`)
  return response.data.data
})

export const addVendorBill = createAsyncThunk('appVendorBills/addVendorBill', async (bill, { dispatch, getState }) => {
  const response = await axios.post('/vendor-bills', bill)
  await dispatch(getData(getState().vendorBills.params))
  await dispatch(getAllData())
  return response.data.data
})

export const updateVendorBill = createAsyncThunk(
  'appVendorBills/updateVendorBill',
  async ({ id, ...bill }, { dispatch, getState }) => {
    const response = await axios.put(`/vendor-bills/${id}`, bill)
    await dispatch(getData(getState().vendorBills.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const markVendorBillPaid = createAsyncThunk(
  'appVendorBills/markVendorBillPaid',
  async (id, { dispatch, getState }) => {
    const response = await axios.post(`/vendor-bills/${id}/mark-paid`)
    await dispatch(getData(getState().vendorBills.params))
    await dispatch(getAllData())
    return response.data.data
  }
)

export const deleteVendorBill = createAsyncThunk('appVendorBills/deleteVendorBill', async (id, { dispatch, getState }) => {
  try {
    await axios.delete(`/vendor-bills/${id}`)
    await dispatch(getData(getState().vendorBills.params))
    await dispatch(getAllData())
    return id
  } catch (err) {
    throw new Error(err?.response?.data?.message || 'Failed to delete')
  }
})

export const getVendorBillAttachments = createAsyncThunk('appVendorBills/getVendorBillAttachments', async billId => {
  const response = await axios.get(`/vendor-bills/${billId}/attachments`)
  return response.data.data.attachments
})

export const uploadVendorBillAttachment = createAsyncThunk(
  'appVendorBills/uploadVendorBillAttachment',
  async ({ billId, file }) => {
    const formData = new FormData()
    formData.append('attachment', file)
    const response = await axios.post(`/vendor-bills/${billId}/attachments`, formData)
    return response.data.data
  }
)

export const deleteVendorBillAttachment = createAsyncThunk('appVendorBills/deleteVendorBillAttachment', async id => {
  await axios.delete(`/vendor-bill-attachments/${id}`)
  return id
})

export const appVendorBillsSlice = createSlice({
  name: 'appVendorBills',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: [],
    selectedVendorBill: null,
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
      .addCase(getVendorBill.fulfilled, (state, action) => {
        state.selectedVendorBill = action.payload
      })
      .addCase(getVendorBillAttachments.fulfilled, (state, action) => {
        state.attachments = action.payload
      })
      .addCase(uploadVendorBillAttachment.fulfilled, (state, action) => {
        state.attachments = [action.payload, ...state.attachments]
      })
      .addCase(deleteVendorBillAttachment.fulfilled, (state, action) => {
        state.attachments = state.attachments.filter(a => a.id !== action.payload)
      })
  }
})

export default appVendorBillsSlice.reducer
