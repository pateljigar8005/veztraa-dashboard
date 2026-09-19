import { Ability } from '@casl/ability'
import { initialAbility } from './initialAbility'

const userData = JSON.parse(localStorage.getItem('userData'))
const existingAbility = userData ? userData.ability : null

export default new Ability(existingAbility || initialAbility)