import axios from 'axios'
import { sortOptions, resolveAvatarUrl } from '@utils'

// Users and projects for the issue pickers/filters.
export const fetchUserOptions = () =>
  axios
    .get('/users', { params: { perPage: 100 } })
    .then(r => sortOptions(r.data.data.users.map(u => ({ value: u.id, label: u.fullName, img: resolveAvatarUrl(u.avatar) }))))

export const fetchProjectOptions = () =>
  axios
    .get('/projects', { params: { perPage: 100 } })
    .then(r => sortOptions(r.data.data.projects.map(p => ({ value: p.id, label: p.name, status: p.status }))))
    .catch(() => [])
