export interface LoginData {
  success: boolean
  name: string
  phonenumber: string
  sessionid: string
  userid: number
  ticketscanner_eventid: string
  email: string
}

export interface MembershipListData {
  societycolor: string
  country: string
  allMemberships: SocietyMemberData[]
  logo_url: string
  success: boolean
  allKeys: string[]
  societyname: string
}

export interface SocietyMemberData {
  sortindex: number
  created: Date
  phonenumber: string
  isvalid: number
  membershipid: number
  Gender: string
  pricepaid: string
  membershiptype: string
  refundtext: string
  studentnumber: string
  fullname: string
  'Payment Method': string
  updated: Date
  email: string
  paymentmethod: string
}
