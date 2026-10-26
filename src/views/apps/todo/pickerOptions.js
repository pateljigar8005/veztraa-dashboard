import axios from 'axios'
import { sortOptions, resolveAvatarUrl } from '@utils'

// Users and projects for the issue pickers/filters.
export const fetchUserOptions = () =>
  axios
    .get('/users', { params: { perPage: 100 } })
    .then(r => sortOptions(r.data.data.users.map(u => ({ value: u.id, label: u.fullName, img: resolveAvatarUrl(u.avatar) }))))

// Assignee choices for a task: the project's members once a project with
// members is picked, everyone otherwise. People already assigned stay in
// the list so an existing assignment never silently disappears.
export const assigneeOptionsFor = (userOptions, project, keepIds = []) => {
  if (!project || !project.memberIds?.length) return userOptions
  return userOptions.filter(o => project.memberIds.includes(o.value) || keepIds.includes(o.value))
}

export const fetchProjectOptions = () =>
  axios
    .get('/projects', { params: { perPage: 100 } })
    .then(r => sortOptions(r.data.data.projects.map(p => ({ value: p.id, label: p.name, status: p.status, memberIds: p.member_ids || [] }))))
    .catch(() => [])
