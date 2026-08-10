import { Fragment, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  getOrCreateVoterToken,
  getCurrentUser,
  getLocalWorkspaceId,
  getPublicTimerUrl,
  getPublicVoteUrl,
  getRememberedWorkspaceId,
  getActiveClubId,
  hasLocalVote,
  isCloudConfigured,
  loadMeetingOpsState,
  loadMeetingRecordsState,
  loadPeopleState,
  loadTimerLiveState,
  loadTimerRecordsState,
  loadLocalState,
  loadRuntimeCloudConfig,
  loadSystemSettings,
  loadVoteState,
  markLocalVoted,
  onAuthChange,
  rememberWorkspaceId,
  saveVoteState,
  saveMeetingOpsState,
  savePeopleState,
  saveRuntimeCloudConfig,
  saveTimerLiveState,
  saveTimerRecordState,
  setActiveClubId,
  seedPeopleState,
  saveSystemSettings,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  submitVote,
} from '../services/tmVoteCloud'
import './ToastmastersVote.css'

function getVoteInstanceKey(data, spaceId = '') {
  const meeting = data?.meeting || {}
  return [
    spaceId,
    meeting.id,
    meeting.number,
    meeting.date,
  ].filter(Boolean).join('|') || 'default'
}

function loadManagedClubs() {
  try {
    return JSON.parse(localStorage.getItem('tm-master-clubs') || '[]')
  } catch {
    return []
  }
}

function getSettingsUrl() {
  const basePath = import.meta.env.BASE_URL || '/'
  return new URL(`${basePath.replace(/\/$/, '')}/tm-vote`, window.location.origin).toString()
}

async function copyText(value = '') {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

const SUPER_ADMIN_EMAILS = ['kenny@smartouch.com.my']

function isSuperAdmin(user) {
  return SUPER_ADMIN_EMAILS.includes(String(user?.email || '').toLowerCase())
}

function isClubAdmin(user, settings = {}) {
  const email = String(user?.email || '').toLowerCase()
  if (!email) return false
  const admins = settings.clubAdmins || []
  const clubs = loadManagedClubs()
  return [settings.username, settings.adminEmail, ...admins.flatMap(item => [item.username, item.email]), ...clubs.flatMap(item => [item.username, item.email])]
    .filter(Boolean)
    .some(value => String(value).toLowerCase() === email)
}

const LANG = {
  zh: {
    navAdmin: '投票设置',
    navSystem: '分会资料设定',
    navMaster: '系统管理',
    navPeople: '会员嘉宾',
    navMeeting: '例会管理',
    navTimer: '计时员',
    navVote: '投票页面',
    navShare: '分享海报',
    navResults: '结果统计',
    navHistory: '历史记录',
    navGroupMeeting: '会议运作',
    navGroupVote: '投票报告',
    navGroupAdmin: '系统设定',
    clubShort: '中华讲演会',
    club: '柔南区麻坡中华校友会讲演会',
    todaySetup: '今日投票设置',
    regularMeeting: '例常活动',
    save: '保存设置',
    openVote: '开放投票',
    closeVote: '关闭投票',
    voteLockedNotice: '投票已开放。请先关闭投票，才可以修改会议资料或候选名单。',
    preview: '预览投票页',
    meetingInfo: '会议资料',
    meetingNo: '会议编号',
    date: '日期',
    theme: '主题',
    word: '每日一词',
    closeTime: '截止时间',
    prepared: '最佳备稿讲员',
    impromptu: '最佳即席讲员',
    evaluator: '最佳评估员',
    name: '姓名',
    speechTitle: '演讲题目',
    project: '项目',
    action: '操作',
    remove: '删除',
    addPrepared: '+ 添加备稿讲员',
    addImpromptu: '+ 添加即席讲员',
    addEvaluator: '+ 添加评估员',
    voteLink: '投票链接',
    timerLink: '计时员链接',
    copyTimerLink: '复制计时员链接',
    copied: '已复制',
    saveNow: '保存中...',
    scanVote: '扫码投票',
    copyLink: '复制链接',
    downloadPoster: '下载分享图片',
    preparedCandidates: '备稿候选',
    impromptuCandidates: '即席候选',
    evaluatorCandidates: '评估候选',
    totalVotes: '总票数',
    voteStatus: '投票状态',
    tonightVote: '今晚最佳表现投票',
    alreadyVoted: '你已经完成投票',
    thanksJoin: '谢谢参与。每台设备每场会议限投一次。',
    notOpen: '投票尚未开放',
    waitOpen: '请等待会议维护人员开放投票。',
    missingSpace: '投票链接缺少分会空间，请重新扫描管理员分享的 QR。',
    cloudNotReadyTitle: '云端未连接',
    cloudNotReadyAdmin: '此版本没有连接 Supabase 云端数据库，不能开放投票或分享 QR。请到分会资料设定里的云端资料库设定，填入 Supabase Project URL 和 anon public key，然后保存刷新。',
    cloudNotReadyVoter: '这个投票链接目前没有连接数据库。会议维护人员请打开分会资料设定，填入 Supabase Project URL 和 anon public key 后重新发布 QR。',
    cloudNotReadyQr: '云端未连接，QR 已停用，避免票数和后台资料不同步。',
    openSettings: '打开分会资料设定',
    cloudDbSettings: '云端资料库设定',
    supabaseUrl: 'Supabase Project URL',
    supabaseAnonKey: 'Supabase anon public key',
    saveCloudConfig: '保存云端设定并刷新',
    cloudConfigHint: '如果 GitHub secrets 还没设，可以先在这里填 Supabase URL 和 anon key。QR 会自动带上公开 anon 配置，让投票者连接同一个云端资料库。',
    currentClub: '当前分会',
    currentUser: '目前使用者',
    roleSuperAdmin: '最高管理员',
    roleClubAdmin: '分会管理员',
    roleUser: '普通使用者',
    defaultClub: '默认分会',
    switchClubHint: '切换分会后，会员、例会、投票、QR 和例会表会使用该分会自己的资料。',
    unnamed: '未命名',
    submit: '提交投票',
    submitting: '提交中...',
    rule: '不记名 | 每人限投一次 | 截止前完成投票',
    voteNow: '立即投票',
    realtime: '实时结果',
    bestPrepared: '最佳备稿',
    bestImpromptu: '最佳即席',
    bestEvaluator: '最佳评估',
    votes: '票',
    preparedVotes: '备稿票数',
    impromptuVotes: '即席票数',
    evaluatorVotes: '评估票数',
    historyDb: '历史得奖者资料库',
    noVotes: '暂无票数',
    tied: '同票',
    pending: '待填写',
    thankVote: '谢谢投票',
    recorded: '你的选择已经记录。',
    viewResults: '查看结果',
    statusOpen: '开放投票',
    statusDraft: '草稿',
    langLabel: '语言',
    cloud: '云端模式',
    local: '本地模式',
    syncing: '同步中...',
    saved: '已保存',
    cloudHint: '连接 Supabase 后，资料和票数会跨设备同步。',
    loadFailed: '云端读取失败，已切换到本地模式。',
    saveFailed: '保存失败，请检查网络或 Supabase 设置。',
    duplicateVote: '这台设备已经投过票。',
    privateSpace: '登录后，每个分会和使用者都有自己的独立管理空间。',
    toastmasterLoginId: 'Toastmaster ID',
    email: '登录 Email',
    loginEmailHint: '请输入 Supabase 登录 Email，不是 Toastmaster ID。',
    password: '密码',
    login: '登录',
    createAccount: '建立账号',
    logout: '登出',
    loginTitle: 'Toastmasters 管理系统',
    loginSubtitle: '登录你的独立空间，管理分会、会员、例会、议程、投票和历史记录。',
    superAdminHint: '系统最高管理员 Email: kenny@smartouch.com.my。请用这个 Email 建立账号或登录。',
    membersTitle: '会员资料库',
    guestsTitle: '嘉宾资料库',
    addMember: '+ 添加会员',
    addGuest: '+ 添加嘉宾',
    englishName: '英文名',
    phone: '电话',
    pathway: 'Pathway',
    level: 'Level',
    status: '状态',
    joinedDate: '加入日期',
    introducedBy: '介绍人',
    visitDate: '来访日期',
    notes: '备注',
    memberId: '会员编号',
    toastmastersId: 'Toastmasters ID',
    birthday: '生日',
    currentProject: '当前项目',
    mentor: '指导员',
    officerRole: 'Officer 职务',
    search: '搜索',
    allStatus: '全部状态',
    allPathways: '全部 Pathway',
    convertToMember: '转会员',
    memberStats: '会员统计',
    activeMembers: '活跃会员',
    guestCount: '嘉宾',
    active: 'Active',
    inactive: 'Inactive',
    importMembers: '从会员资料带入',
    syncFromRoles: '同步当前例会职务',
    importRole: '导入例会职务',
    peopleSaved: '会员/嘉宾已保存',
    importChungHwaList: '导入中化名单',
    importWhatsappList: '导入名单',
    pastePeopleList: '粘贴 WhatsApp 名单',
    pastePeopleListHint: '把 WhatsApp 名单贴在这里，系统会自动判断会员和嘉宾，并加入当前分会资料库。',
    importAsMemberHint: '含有会员、🆓、免费、member 会导入会员；含有嘉宾、guest、来宾、RM、✅ 会导入嘉宾；没有关键字默认导入会员。',
    listImported: '名单已导入',
    meetingSaved: '例会资料已保存',
    attendanceTitle: '出席记录',
    rolesTitle: '职务分配',
    agendaTitle: '例会表',
    printAgenda: '列印例会表',
    downloadPdf: '下载PDF',
    generatingPdf: 'PDF生成中...',
    attended: '出席',
    absent: '缺席',
    role: '职务',
    roleTime: '时间/分钟',
    assignee: '担任者',
    addRole: '+ 添加职务',
    resetRoles: '套用完整职务模板',
    member: '会员',
    guest: '嘉宾',
    preparedSpeakers: '备稿讲员',
    evaluators: '评估员',
    tableTopics: '即席讲员',
    systemTitle: '分会资料设定',
    systemSubtitle: '维护分会名称、Logo、例会表模板和分会管理者。投票者只需要 QR code，不需要登录。',
    clubName: '分会名称',
    clubShortName: '分会简称',
    toastmasterId: 'Toastmaster ID',
    adminName: '管理员姓名',
    username: 'User Name',
    userId: 'User ID',
    systemSaved: '系统设定已保存',
    accountNote: '这里可以记录分会管理者资料。正式上线时，密码应由系统管理通过 Supabase Auth / Edge Function 建立，不建议长期保存明文密码。',
    masterNote: '系统管理是给最高管理者新建分会、分会管理者 ID 和密码使用。',
    logoUpload: '上传分会 Logo',
    agendaTemplate: '上传例会表 Template',
    agendaRoleTemplate: '例会表职务模板',
    addTemplateRole: '+ 加入模板职务',
    clubAdmins: '分会管理者',
    addClubAdmin: '+ 加入管理者',
    masterTitle: '系统管理',
    masterSubtitle: '最高管理者用于新建分会、分配 Toastmaster ID、User Name 和初始 Password。',
    createClub: '新建分会',
    saveClubList: '保存分会列表',
    clubCreated: '分会已加入',
    clubListSaved: '分会列表已保存',
    noClub: '还没有分会记录',
    createClubHint: '请填写分会名称、Login Email、User Name 和 Password',
    clubList: '分会列表',
    newMeeting: '新建例会',
    editMeeting: '修改例会',
    meetingRecords: '例会记录',
    currentMeeting: '本次例会',
    lockedMeeting: '已锁定',
    editableMeeting: '可修改',
    savedMeeting: '已收藏',
    selectRecord: '查看旧记录',
    recordLockedNote: '旧记录只能查看，不能删除。收藏超过 7 天后不允许修改。',
    importAgenda: '导入例会表 / Excel',
    pasteAgenda: '粘贴例会表文字',
    pasteAgendaHint: '把含有职务和会员/嘉宾名字的例会表文字贴在这里，系统会自动匹配资料库姓名并填入职务。',
    applyImport: '套用导入',
    cancel: '取消',
    importApplied: '例会表已导入',
    exportExcel: '导出 Excel',
    templateReady: '已上传模板',
  },
  en: {
    navAdmin: 'Setup',
    navSystem: 'Club Profile Settings',
    navMaster: 'System Admin',
    navPeople: 'Members & Guests',
    navMeeting: 'Meeting & Agenda',
    navTimer: 'Timer',
    navVote: 'Voting Page',
    navShare: 'Share Poster',
    navResults: 'Results',
    navHistory: 'History',
    navGroupMeeting: 'Meeting',
    navGroupVote: 'Voting & Reports',
    navGroupAdmin: 'Settings',
    clubShort: 'Chung Hwa Toastmasters',
    club: 'Johor South Muar Chung Hwa Alumni Toastmasters Club',
    todaySetup: 'Today Voting Setup',
    regularMeeting: 'Regular Meeting',
    save: 'Save Settings',
    openVote: 'Open Voting',
    closeVote: 'Close Voting',
    voteLockedNotice: 'Voting is open. Close voting before editing meeting details or candidates.',
    preview: 'Preview Voting Page',
    meetingInfo: 'Meeting Info',
    meetingNo: 'Meeting No.',
    date: 'Date',
    theme: 'Theme',
    word: 'Word of the Day',
    closeTime: 'Close Time',
    prepared: 'Best Prepared Speaker',
    impromptu: 'Best Table Topics Speaker',
    evaluator: 'Best Evaluator',
    name: 'Name',
    speechTitle: 'Speech Title',
    project: 'Project',
    action: 'Action',
    remove: 'Remove',
    addPrepared: '+ Add Prepared Speaker',
    addImpromptu: '+ Add Table Topics Speaker',
    addEvaluator: '+ Add Evaluator',
    voteLink: 'Voting Link',
    timerLink: 'Timer Link',
    copyTimerLink: 'Copy Timer Link',
    copied: 'Copied',
    saveNow: 'Saving...',
    scanVote: 'Scan to Vote',
    copyLink: 'Copy Link',
    downloadPoster: 'Download Share Image',
    preparedCandidates: 'Prepared Candidates',
    impromptuCandidates: 'Table Topics Candidates',
    evaluatorCandidates: 'Evaluator Candidates',
    totalVotes: 'Total Votes',
    voteStatus: 'Voting Status',
    tonightVote: 'Tonight Best Performance Vote',
    alreadyVoted: 'You have already voted',
    thanksJoin: 'Thank you. One vote per device for this meeting.',
    notOpen: 'Voting is not open yet',
    waitOpen: 'Please wait for the meeting admin to open voting.',
    missingSpace: 'Voting link is missing the club workspace. Please scan the admin QR again.',
    cloudNotReadyTitle: 'Cloud is not connected',
    cloudNotReadyAdmin: 'This build is not connected to the Supabase cloud database, so voting and QR sharing are disabled. Open Club Settings, enter the Supabase Project URL and anon public key, then save and reload.',
    cloudNotReadyVoter: 'This voting link is not connected to the database. Meeting admins should open Club Settings, enter the Supabase Project URL and anon public key, then publish the QR again.',
    cloudNotReadyQr: 'Cloud is not connected. QR is disabled to prevent votes from drifting away from admin data.',
    openSettings: 'Open Club Settings',
    cloudDbSettings: 'Cloud Database Settings',
    supabaseUrl: 'Supabase Project URL',
    supabaseAnonKey: 'Supabase anon public key',
    saveCloudConfig: 'Save Cloud Settings and Reload',
    cloudConfigHint: 'If GitHub secrets are not set yet, enter the Supabase URL and anon key here. The QR will carry this public anon config so voters connect to the same cloud database.',
    currentClub: 'Current Club',
    currentUser: 'Current User',
    roleSuperAdmin: 'Super Admin',
    roleClubAdmin: 'Club Admin',
    roleUser: 'User',
    defaultClub: 'Default Club',
    switchClubHint: 'After switching clubs, members, meetings, votes, QR links, and agendas use that club’s own data.',
    unnamed: 'Unnamed',
    submit: 'Submit Vote',
    submitting: 'Submitting...',
    rule: 'Anonymous | One vote per person | Vote before closing',
    voteNow: 'Vote Now',
    realtime: 'Live Results',
    bestPrepared: 'Best Prepared',
    bestImpromptu: 'Best Table Topics',
    bestEvaluator: 'Best Evaluator',
    votes: 'votes',
    preparedVotes: 'Prepared Votes',
    impromptuVotes: 'Table Topics Votes',
    evaluatorVotes: 'Evaluator Votes',
    historyDb: 'Winner History Database',
    noVotes: 'No votes yet',
    tied: 'Tied',
    pending: 'Pending',
    thankVote: 'Thank You',
    recorded: 'Your vote has been recorded.',
    viewResults: 'View Results',
    statusOpen: 'Open',
    statusDraft: 'Draft',
    langLabel: 'Language',
    cloud: 'Cloud Mode',
    local: 'Local Mode',
    syncing: 'Syncing...',
    saved: 'Saved',
    cloudHint: 'Connect Supabase to sync meetings and votes across devices.',
    loadFailed: 'Cloud loading failed. Switched to local mode.',
    saveFailed: 'Save failed. Please check network or Supabase settings.',
    duplicateVote: 'This device has already voted.',
    privateSpace: 'After login, every club and user has an independent management workspace.',
    toastmasterLoginId: 'Toastmaster ID',
    email: 'Login Email',
    loginEmailHint: 'Enter your Supabase login email, not the Toastmaster ID.',
    password: 'Password',
    login: 'Login',
    createAccount: 'Create Account',
    logout: 'Logout',
    loginTitle: 'Toastmasters Management System',
    loginSubtitle: 'Sign in to manage clubs, members, meetings, agendas, voting, and history.',
    superAdminHint: 'System Super Admin Email: kenny@smartouch.com.my. Create an account or log in with this email.',
    membersTitle: 'Member Directory',
    guestsTitle: 'Guest Directory',
    addMember: '+ Add Member',
    addGuest: '+ Add Guest',
    englishName: 'English Name',
    phone: 'Phone',
    pathway: 'Pathway',
    level: 'Level',
    status: 'Status',
    joinedDate: 'Joined Date',
    introducedBy: 'Introduced By',
    visitDate: 'Visit Date',
    notes: 'Notes',
    memberId: 'Member ID',
    toastmastersId: 'Toastmasters ID',
    birthday: 'Birthday',
    currentProject: 'Current Project',
    mentor: 'Mentor',
    officerRole: 'Officer Role',
    search: 'Search',
    allStatus: 'All Status',
    allPathways: 'All Pathways',
    convertToMember: 'Convert to Member',
    memberStats: 'Member Stats',
    activeMembers: 'Active Members',
    guestCount: 'Guests',
    active: 'Active',
    inactive: 'Inactive',
    importMembers: 'Import from Members',
    syncFromRoles: 'Sync Current Meeting Roles',
    importRole: 'Import Meeting Role',
    peopleSaved: 'Members / guests saved',
    importChungHwaList: 'Import Chung Hwa List',
    importWhatsappList: 'Import List',
    pastePeopleList: 'Paste WhatsApp List',
    pastePeopleListHint: 'Paste a WhatsApp name list here. The system will detect members and guests, then add them to the current club directory.',
    importAsMemberHint: 'Lines with member, free, or 🆓 import as members. Lines with guest, visitor, RM, or ✅ import as guests. Lines without keywords import as members.',
    listImported: 'List imported',
    meetingSaved: 'Meeting details saved',
    attendanceTitle: 'Attendance',
    rolesTitle: 'Role Assignment',
    agendaTitle: 'Agenda',
    printAgenda: 'Print Agenda',
    downloadPdf: 'Download PDF',
    generatingPdf: 'Generating PDF...',
    attended: 'Attended',
    absent: 'Absent',
    role: 'Role',
    roleTime: 'Time / min',
    assignee: 'Assignee',
    addRole: '+ Add Role',
    resetRoles: 'Apply Full Role Template',
    member: 'Member',
    guest: 'Guest',
    preparedSpeakers: 'Prepared Speakers',
    evaluators: 'Evaluators',
    tableTopics: 'Table Topics',
    systemTitle: 'Club Profile Settings',
    systemSubtitle: 'Manage club name, logo, agenda template, and club admins. Voters only need the QR code, no login required.',
    clubName: 'Club Name',
    clubShortName: 'Club Short Name',
    toastmasterId: 'Toastmaster ID',
    adminName: 'Admin Name',
    username: 'User Name',
    userId: 'User ID',
    systemSaved: 'System settings saved',
    accountNote: 'Club admin details can be recorded here. In production, passwords should be provisioned by System Admin through Supabase Auth / Edge Function, not stored as long-term plain text.',
    masterNote: 'System Admin is for the owner to create clubs, club admin IDs, and initial passwords.',
    logoUpload: 'Upload Club Logo',
    agendaTemplate: 'Upload Agenda Template',
    agendaRoleTemplate: 'Agenda Role Template',
    addTemplateRole: '+ Add Template Role',
    clubAdmins: 'Club Admins',
    addClubAdmin: '+ Add Admin',
    masterTitle: 'System Admin',
    masterSubtitle: 'Owner-only area to create clubs, Toastmaster IDs, user names, and initial passwords.',
    createClub: 'Create Club',
    saveClubList: 'Save Club List',
    clubCreated: 'Club added',
    clubListSaved: 'Club list saved',
    noClub: 'No club records yet',
    createClubHint: 'Please enter club name, login email, user name, and password',
    clubList: 'Club List',
    newMeeting: 'New Meeting',
    editMeeting: 'Edit Meeting',
    meetingRecords: 'Meeting Records',
    currentMeeting: 'Current Meeting',
    lockedMeeting: 'Locked',
    editableMeeting: 'Editable',
    savedMeeting: 'Saved Meeting',
    selectRecord: 'View Past Record',
    recordLockedNote: 'Past records are view-only and cannot be deleted. Saved records lock after 7 days.',
    importAgenda: 'Import Agenda / Excel',
    pasteAgenda: 'Paste Agenda Text',
    pasteAgendaHint: 'Paste agenda text with role names and member or guest names. The system will match names from your directory and fill roles automatically.',
    applyImport: 'Apply Import',
    cancel: 'Cancel',
    importApplied: 'Agenda text imported',
    exportExcel: 'Export Excel',
    templateReady: 'Template uploaded',
  },
}

function meetingStatusLabel(status, t) {
  if (status === 'open' || status === '开放投票' || status === '开放中') return t.statusOpen
  return t.statusDraft
}

function winner(list, t) {
  const sorted = [...list].sort((a, b) => b.votes - a.votes)
  if (!sorted.length || sorted[0].votes === 0) return { label: t.noVotes, votes: 0, tied: false }
  const tied = sorted[1] && sorted[1].votes === sorted[0].votes
  return { label: tied ? t.tied : sorted[0].name, votes: sorted[0].votes, tied }
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function QrBlock({ value, compact = false }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let ignore = false
    QRCode.toDataURL(value || window.location.href, {
      margin: 1,
      width: compact ? 260 : 186,
      color: { dark: '#050505', light: '#ffffff' },
    }).then(nextSrc => {
      if (!ignore) setSrc(nextSrc)
    })
    return () => { ignore = true }
  }, [value, compact])

  return (
    <div className={`tm-qr ${compact ? 'compact' : ''}`} aria-label="QR code">
      {src ? <img src={src} alt="QR code" /> : null}
    </div>
  )
}

function LanguageToggle({ lang, setLang, t }) {
  return (
    <div className="tm-lang-toggle" aria-label={t.langLabel}>
      <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLang('zh')}>中文</button>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  )
}

function SyncBadge({ source, syncStatus, t }) {
  return (
    <div className="tm-sync-badge">
      <b>{source === 'cloud' ? t.cloud : t.local}</b>
      <span>{syncStatus || (source === 'cloud' ? t.saved : t.cloudHint)}</span>
    </div>
  )
}

function CandidateNamePicker({ item, members, onSelectMember, onTypeOther, t, disabled = false }) {
  const isKnownMember = members.some(member => member.name === item.name)
  const value = item.name && isKnownMember ? item.name : item.name ? '__other__' : ''

  function handleChange(event) {
    const nextValue = event.target.value
    if (nextValue === '__other__') {
      onTypeOther(item.name && !isKnownMember ? item.name : '')
      return
    }
    const member = members.find(entry => entry.name === nextValue)
    if (member) onSelectMember(member)
  }

  return (
    <div className="tm-name-picker">
      <select value={value} onChange={handleChange} disabled={disabled}>
        <option value="">{t.name}</option>
        {members.map(member => (
          <option key={member.id} value={member.name}>{member.name}</option>
        ))}
        <option value="__other__">其他 / Other</option>
      </select>
      {value === '__other__' && (
        <input value={item.name} disabled={disabled} onChange={event => onTypeOther(event.target.value)} placeholder="其他 / Other" />
      )}
    </div>
  )
}

function roleMatchesCandidateType(roleName, type) {
  const key = canonicalAgendaRoleKey(roleName)
  if (type === 'prepared') return key.startsWith('prepared-') || /prepared speaker/i.test(roleName)
  if (type === 'impromptu') return key.startsWith('topics-') || /table topics speaker/i.test(roleName)
  if (type === 'evaluator') return key.startsWith('evaluator-') || /^evaluator\b/i.test(roleName)
  return false
}

function CandidateEditor({ type, candidates, onChange, t, people, meetingRoles = [], locked = false }) {
  const isPrepared = type === 'prepared'
  const title = isPrepared ? t.prepared : type === 'evaluator' ? t.evaluator : t.impromptu
  const activeMembers = (people?.members || []).filter(member => member.status !== 'inactive' && member.name)
  const candidateRoles = meetingRoles.filter(role => roleMatchesCandidateType(role.roleName, type))

  function update(id, field, value) {
    if (locked) return
    onChange(candidates.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function selectMember(id, member) {
    if (locked) return
    onChange(candidates.map(item => {
      if (item.id !== id) return item
      const project = [member.pathway, member.level].filter(Boolean).join(' ')
      return isPrepared
        ? { ...item, name: member.name, project: project || item.project }
        : { ...item, name: member.name }
    }))
  }

  function addCandidate() {
    if (locked) return
    const nextId = `${type[0]}${Date.now()}`
    onChange([
      ...candidates,
      isPrepared
        ? { id: nextId, name: '', title: '', project: '', votes: 0 }
        : { id: nextId, name: '', votes: 0 },
    ])
  }

  function addFromRole(roleId) {
    if (locked) return
    const role = candidateRoles.find(item => item.id === roleId)
    if (!role) return
    const name = personLabel(people, role.personType, role.personId)
    if (!name) return
    const nextId = `${type[0]}${Date.now()}`
    const candidate = isPrepared
      ? { id: nextId, name, title: '', project: '', votes: 0 }
      : { id: nextId, name, votes: 0 }
    onChange([
      ...candidates.filter(item => item.name !== name),
      candidate,
    ])
  }

  function remove(id) {
    if (locked) return
    onChange(candidates.filter(item => item.id !== id))
  }

  return (
    <section className="tm-panel">
      <div className="tm-panel-title">
        <span className="tm-icon">{isPrepared ? '🏆' : '🎤'}</span>
        <h2>{title}</h2>
      </div>
      <div className="tm-role-import">
        <select value="" disabled={locked} onChange={event => addFromRole(event.target.value)}>
          <option value="">{t.importRole}</option>
          {candidateRoles.map(role => {
            const name = personLabel(people, role.personType, role.personId)
            return (
              <option key={role.id} value={role.id}>
                {role.roleName}{name ? ` - ${name}` : ''}
              </option>
            )
          })}
        </select>
      </div>

      {isPrepared ? (
        <div className="tm-table">
          <div className="tm-table-head">
            <span>{t.name}</span>
            <span>{t.speechTitle}</span>
            <span>{t.project}</span>
            <span>{t.action}</span>
          </div>
          {candidates.map(item => (
            <div className="tm-table-row" key={item.id}>
              <CandidateNamePicker
                item={item}
                members={activeMembers}
                onSelectMember={member => selectMember(item.id, member)}
                onTypeOther={value => update(item.id, 'name', value)}
                t={t}
                disabled={locked}
              />
              <input value={item.title} disabled={locked} onChange={e => update(item.id, 'title', e.target.value)} />
              <input value={item.project} disabled={locked} onChange={e => update(item.id, 'project', e.target.value)} />
              <button className="tm-danger" disabled={locked} onClick={() => remove(item.id)}>{t.remove}</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="tm-chip-editor">
          {candidates.map(item => (
            <label className="tm-name-chip" key={item.id}>
              <CandidateNamePicker
                item={item}
                members={activeMembers}
                onSelectMember={member => selectMember(item.id, member)}
                onTypeOther={value => update(item.id, 'name', value)}
                t={t}
                disabled={locked}
              />
              <button disabled={locked} onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}>x</button>
            </label>
          ))}
        </div>
      )}

      <button className="tm-outline" disabled={locked} onClick={addCandidate}>
        {isPrepared ? t.addPrepared : type === 'evaluator' ? t.addEvaluator : t.addImpromptu}
      </button>
    </section>
  )
}

function AdminView({ data, setData, setView, persistState, source, syncStatus, t, people, meetingOps, spaceId, voteLink }) {
  const cloudReady = isCloudConfigured && source === 'cloud' && spaceId && !spaceId.startsWith('local-')
  const isVotingOpen = ['open', '开放投票', '开放中'].includes(data.meeting.status)
  const [actionStatus, setActionStatus] = useState('')

  function updateMeeting(field, value) {
    if (isVotingOpen) return
    setData({ ...data, meeting: { ...data.meeting, [field]: value } })
  }

  function updateCandidates(field, list) {
    if (isVotingOpen) return
    setData({ ...data, [field]: list })
  }

  function syncedVoteData(nextData = data) {
    const synced = candidatesFromMeetingRoles(meetingOps.roles, people, nextData)
    return {
      ...synced,
      meeting: {
        ...synced.meeting,
        link: voteLink || getPublicVoteUrl(spaceId),
      },
    }
  }

  function saveSetup() {
    const next = {
      ...data,
      meeting: {
        ...data.meeting,
        link: voteLink || getPublicVoteUrl(spaceId),
      },
    }
    setData(next)
    setActionStatus(t.saveNow)
    Promise.resolve(persistState(next))
      .then(() => setActionStatus(t.saved))
      .catch(err => setActionStatus(err.message || t.saveFailed))
  }

  function setStatus(status) {
    if (status === 'open' && !cloudReady) return
    const next = {
      ...data,
      meeting: {
        ...data.meeting,
        status,
        link: voteLink || getPublicVoteUrl(spaceId),
      },
    }
    setData(next)
    persistState(next)
  }

  function importFromMembers() {
    if (isVotingOpen) return
    const activeMembers = (people?.members || []).filter(member => member.status !== 'inactive')
    const toBasicCandidate = (member, prefix, index) => ({
      id: `${prefix}${Date.now()}${index}`,
      name: member.name,
      title: '',
      project: [member.pathway, member.level].filter(Boolean).join(' '),
      votes: 0,
    })
    const toNameCandidate = (member, prefix, index) => ({
      id: `${prefix}${Date.now()}${index}`,
      name: member.name,
      votes: 0,
    })
    const next = {
      ...data,
      prepared: activeMembers.slice(0, 2).map((member, index) => toBasicCandidate(member, 'p', index)),
      impromptu: activeMembers.slice(0, 4).map((member, index) => toNameCandidate(member, 'i', index)),
      evaluator: activeMembers.slice(0, 2).map((member, index) => toNameCandidate(member, 'e', index)),
    }
    setData(next)
  }

  function syncFromMeetingRoles() {
    if (isVotingOpen) return
    setData(syncedVoteData())
  }

  const savedVotes =
    data.prepared.reduce((sum, item) => sum + item.votes, 0) +
    data.impromptu.reduce((sum, item) => sum + item.votes, 0) +
    data.evaluator.reduce((sum, item) => sum + item.votes, 0)

  return (
    <div className="tm-admin-grid">
      <div className="tm-main-column">
        <div className="tm-screen-head">
          <div>
            <h1>{t.todaySetup} <span>{meetingStatusLabel(data.meeting.status, t)}</span></h1>
            <p>{data.meeting.number} {t.regularMeeting} | {data.meeting.theme}</p>
            {actionStatus && <div className="tm-sync-badge"><b>{actionStatus}</b></div>}
            <SyncBadge source={source} syncStatus={syncStatus} t={t} />
          </div>
          <div className="tm-actions">
            <button onClick={saveSetup}>{t.save}</button>
            <button disabled={isVotingOpen} onClick={importFromMembers}>{t.importMembers}</button>
            <button disabled={isVotingOpen} onClick={syncFromMeetingRoles}>{t.syncFromRoles}</button>
            {isVotingOpen ? (
              <button className="tm-gold" disabled={!cloudReady} onClick={() => setStatus('draft')}>{t.closeVote}</button>
            ) : (
              <button className="tm-gold" disabled={!cloudReady} onClick={() => setStatus('open')}>{t.openVote}</button>
            )}
            <button disabled={!cloudReady} onClick={() => setView('vote')}>{t.preview}</button>
          </div>
        </div>

        {isVotingOpen && <div className="tm-sync-badge"><b>{t.voteLockedNotice}</b></div>}

        {!cloudReady && (
          <section className="tm-panel tm-note-panel">
            <h2>{t.cloudNotReadyTitle}</h2>
            <p>{t.cloudNotReadyAdmin}</p>
            <a className="tm-card-action" href={getSettingsUrl()}>{t.openSettings}</a>
          </section>
        )}

        <section className="tm-panel">
          <div className="tm-panel-title">
            <span className="tm-icon">📋</span>
            <h2>{t.meetingInfo}</h2>
          </div>
          <div className="tm-form-grid">
            {[
              ['number', t.meetingNo],
              ['date', t.date],
              ['theme', t.theme],
              ['word', t.word],
              ['closeTime', t.closeTime],
            ].map(([field, label]) => (
              <label key={field}>
                <span>{label}</span>
                <input value={data.meeting[field]} disabled={isVotingOpen} onChange={e => updateMeeting(field, e.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <CandidateEditor type="prepared" candidates={data.prepared} onChange={list => updateCandidates('prepared', list)} t={t} people={people} meetingRoles={meetingOps.roles} locked={isVotingOpen} />
        <CandidateEditor type="impromptu" candidates={data.impromptu} onChange={list => updateCandidates('impromptu', list)} t={t} people={people} meetingRoles={meetingOps.roles} locked={isVotingOpen} />
        <CandidateEditor type="evaluator" candidates={data.evaluator} onChange={list => updateCandidates('evaluator', list)} t={t} people={people} meetingRoles={meetingOps.roles} locked={isVotingOpen} />
      </div>

      <aside className="tm-share-panel">
        <h2>{t.voteLink}</h2>
        {cloudReady ? (
          <>
            <p>{t.scanVote}</p>
            <QrBlock value={voteLink} />
            <strong>{voteLink}</strong>
            <button onClick={() => copyText(voteLink).then(() => setActionStatus(t.copied)).catch(err => setActionStatus(err.message || t.saveFailed))}>{actionStatus === t.copied ? t.copied : t.copyLink}</button>
            <button className="tm-outline" onClick={() => setView('share')}>{t.downloadPoster}</button>
          </>
        ) : (
          <div className="tm-empty-row">{t.cloudNotReadyQr}</div>
        )}
        <div className="tm-stat-row"><span>{t.preparedCandidates}</span><b>{data.prepared.length}</b></div>
        <div className="tm-stat-row"><span>{t.impromptuCandidates}</span><b>{data.impromptu.length}</b></div>
        <div className="tm-stat-row"><span>{t.evaluatorCandidates}</span><b>{data.evaluator.length}</b></div>
        <div className="tm-stat-row"><span>{t.totalVotes}</span><b>{savedVotes}</b></div>
        <div className="tm-stat-row"><span>{t.voteStatus}</span><b>{meetingStatusLabel(data.meeting.status, t)}</b></div>
      </aside>
    </div>
  )
}

function SystemSettingsView({ settings, setSettings, persistSettings, syncStatus, t, superAdmin = false }) {
  const [cloudConfig, setCloudConfig] = useState(() => loadRuntimeCloudConfig())
  const locked = !superAdmin

  function update(field, value) {
    if (locked) return
    setSettings({ ...settings, [field]: value })
  }

  function updateCloudConfig(field, value) {
    if (locked) return
    setCloudConfig({ ...cloudConfig, [field]: value })
  }

  function persistCloudConfig() {
    if (locked) return
    saveRuntimeCloudConfig(cloudConfig)
    window.location.reload()
  }

  function updateAdmin(id, field, value) {
    if (locked) return
    setSettings({
      ...settings,
      clubAdmins: (settings.clubAdmins || []).map(item => item.id === id ? { ...item, [field]: value } : item),
    })
  }

  function addAdmin() {
    if (locked) return
    setSettings({
      ...settings,
      clubAdmins: [
        ...(settings.clubAdmins || []),
        { id: `a${Date.now()}`, toastmasterId: settings.toastmasterId || localStorage.getItem('tm-login-toastmaster-id') || getActiveClubId(), email: '', username: '', password: '', name: '' },
      ],
    })
  }

  function removeAdmin(id) {
    if (locked) return
    setSettings({
      ...settings,
      clubAdmins: (settings.clubAdmins || []).filter(item => item.id !== id),
    })
  }

  function updateTemplateRole(index, value) {
    if (locked) return
    const nextRoles = [...(settings.agendaRoleTemplate || [])]
    const current = typeof nextRoles[index] === 'string' ? { roleName: nextRoles[index], time: '' } : nextRoles[index]
    nextRoles[index] = { ...current, roleName: value }
    setSettings({ ...settings, agendaRoleTemplate: nextRoles })
  }

  function updateTemplateRoleTime(index, value) {
    if (locked) return
    const nextRoles = [...(settings.agendaRoleTemplate || [])]
    const current = typeof nextRoles[index] === 'string' ? { roleName: nextRoles[index], time: '' } : nextRoles[index]
    nextRoles[index] = { ...current, time: value }
    setSettings({ ...settings, agendaRoleTemplate: nextRoles })
  }

  function addTemplateRole() {
    if (locked) return
    setSettings({
      ...settings,
      agendaRoleTemplate: [...(settings.agendaRoleTemplate || []), { roleName: '', time: '' }],
    })
  }

  function removeTemplateRole(index) {
    if (locked) return
    setSettings({
      ...settings,
      agendaRoleTemplate: (settings.agendaRoleTemplate || []).filter((_, currentIndex) => currentIndex !== index),
    })
  }

  function readFile(event, field, nameField = '') {
    if (locked) return
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSettings({
        ...settings,
        [field]: reader.result,
        ...(nameField ? { [nameField]: file.name } : {}),
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="tm-main-column">
      <div className="tm-screen-head">
        <div>
          <h1>{t.systemTitle}</h1>
          <p>{t.systemSubtitle}</p>
          {syncStatus && <div className="tm-sync-badge"><b>{syncStatus}</b></div>}
        </div>
        <div className="tm-actions">
          <button className="tm-gold" disabled={locked} onClick={() => persistSettings(settings)}>{t.save}</button>
        </div>
      </div>

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">⚙</span>
          <h2>{t.navSystem}</h2>
        </div>
        <div className="tm-form-grid">
          <label>
            <span>{t.clubName}</span>
            <input disabled={locked} value={settings.clubName} onChange={event => update('clubName', event.target.value)} />
          </label>
          <label>
            <span>{t.clubShortName}</span>
            <input disabled={locked} value={settings.clubShort} onChange={event => update('clubShort', event.target.value)} />
          </label>
          <label>
            <span>{t.toastmasterId}</span>
            <input disabled={locked} value={settings.toastmasterId} onChange={event => update('toastmasterId', event.target.value)} />
          </label>
          <label>
            <span>{t.userId}</span>
            <input disabled={locked} value={settings.username} onChange={event => update('username', event.target.value)} />
          </label>
          <label>
            <span>{t.adminName}</span>
            <input disabled={locked} value={settings.adminName} onChange={event => update('adminName', event.target.value)} />
          </label>
          <label>
            <span>例会表语言 / Agenda Language</span>
            <select disabled={locked} value={settings.agendaLanguage || 'auto'} onChange={event => update('agendaLanguage', event.target.value)}>
              <option value="auto">跟随界面 / Follow UI</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="bi">双语 / Bilingual</option>
            </select>
          </label>
        </div>
      </section>

      {superAdmin && <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">☁</span>
          <h2>{t.cloudDbSettings}</h2>
        </div>
        <p className="tm-panel-hint">{t.cloudConfigHint}</p>
        <div className="tm-form-grid">
          <label>
            <span>{t.supabaseUrl}</span>
            <input value={cloudConfig.url} onChange={event => updateCloudConfig('url', event.target.value.trim())} placeholder="https://xxxx.supabase.co" />
          </label>
          <label>
            <span>{t.supabaseAnonKey}</span>
            <input value={cloudConfig.anonKey} onChange={event => updateCloudConfig('anonKey', event.target.value.trim())} placeholder="eyJ..." />
          </label>
        </div>
        <button className="tm-gold" onClick={persistCloudConfig}>{t.saveCloudConfig}</button>
      </section>}

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">▣</span>
          <h2>{t.logoUpload}</h2>
        </div>
        <div className="tm-upload-grid">
          <label className="tm-upload-box">
            <span>{t.logoUpload}</span>
            <input disabled={locked} type="file" accept="image/*" onChange={event => readFile(event, 'logoDataUrl')} />
          </label>
          <div className="tm-logo-preview">
            {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt={t.logoUpload} /> : <span>{t.clubShort}</span>}
          </div>
          <label className="tm-upload-box">
            <span>{t.agendaTemplate}</span>
            <input disabled={locked} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={event => readFile(event, 'agendaTemplateDataUrl', 'agendaTemplateName')} />
          </label>
          <div className="tm-template-preview">
            <b>{settings.agendaTemplateName || t.pending}</b>
            {settings.agendaTemplateName && <small>{t.templateReady}</small>}
          </div>
        </div>
      </section>

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">☷</span>
          <h2>{t.agendaRoleTemplate}</h2>
        </div>
        <div className="tm-template-roles">
          {(settings.agendaRoleTemplate || []).map((role, index) => {
            const templateRole = typeof role === 'string' ? { roleName: role, time: '' } : role
            return (
            <div key={`${templateRole.roleName}-${index}`} className="tm-template-role-row">
              <span>{index + 1}</span>
              <input disabled={locked} value={templateRole.roleName} onChange={event => updateTemplateRole(index, event.target.value)} />
              <input disabled={locked} value={templateRole.time || ''} onChange={event => updateTemplateRoleTime(index, event.target.value)} placeholder="min" />
              {superAdmin && <button className="tm-danger" onClick={() => removeTemplateRole(index)}>{t.remove}</button>}
            </div>
            )
          })}
        </div>
        {superAdmin && <button className="tm-outline" onClick={addTemplateRole}>{t.addTemplateRole}</button>}
      </section>

      {superAdmin && <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">👤</span>
          <h2>{t.clubAdmins}</h2>
        </div>
        <div className="tm-directory-table admins">
          <div className="tm-directory-head">
            <span>{t.toastmasterId}</span>
            <span>{t.email}</span>
            <span>{t.userId}</span>
            <span>{t.password}</span>
            <span>{t.adminName}</span>
            <span>{t.action}</span>
          </div>
          {(settings.clubAdmins || []).map(item => (
            <div className="tm-directory-row" key={item.id}>
              <input value={item.toastmasterId} onChange={event => updateAdmin(item.id, 'toastmasterId', event.target.value)} />
              <input value={item.email || ''} onChange={event => updateAdmin(item.id, 'email', event.target.value)} />
              <input value={item.username} onChange={event => updateAdmin(item.id, 'username', event.target.value)} />
              <input value={item.password} type="password" onChange={event => updateAdmin(item.id, 'password', event.target.value)} />
              <input value={item.name} onChange={event => updateAdmin(item.id, 'name', event.target.value)} />
              <button className="tm-danger" onClick={() => removeAdmin(item.id)}>{t.remove}</button>
            </div>
          ))}
        </div>
        <button className="tm-outline" onClick={addAdmin}>{t.addClubAdmin}</button>
      </section>}

      <section className="tm-panel tm-note-panel">
        <p>{t.accountNote}</p>
        <p>{t.masterNote}</p>
      </section>
    </div>
  )
}

function MasterAdminView({ settings, t, onClubsChange }) {
  const admins = settings.clubAdmins || []
  const [clubs, setClubs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tm-master-clubs') || '[]')
    } catch {
      return []
    }
  })
  const [draft, setDraft] = useState({
    clubName: '',
    toastmasterId: '',
    email: '',
    username: '',
    password: '',
    adminName: '',
  })
  const [message, setMessage] = useState('')

  function updateDraft(field, value) {
    setDraft({ ...draft, [field]: value })
  }

  function createClub() {
    if (!draft.clubName || !draft.email || !draft.email.includes('@') || !draft.username || !draft.password) {
      setMessage(t.createClubHint)
      document.getElementById('tm-create-club-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const nextClubs = [
      ...clubs,
      { ...draft, id: `club${Date.now()}` },
    ]
    setClubs(nextClubs)
    onClubsChange?.(nextClubs)
    localStorage.setItem('tm-master-clubs', JSON.stringify(nextClubs))
    setDraft({ clubName: '', toastmasterId: '', email: '', username: '', password: '', adminName: '' })
    setMessage(t.clubCreated)
  }

  function updateClub(id, field, value) {
    const nextClubs = clubs.map(club => club.id === id ? { ...club, [field]: value } : club)
    setClubs(nextClubs)
    onClubsChange?.(nextClubs)
  }

  function deleteClub(id) {
    const nextClubs = clubs.filter(club => club.id !== id)
    setClubs(nextClubs)
    onClubsChange?.(nextClubs)
    localStorage.setItem('tm-master-clubs', JSON.stringify(nextClubs))
  }

  function saveClubList() {
    let nextClubs = clubs
    if (draft.clubName || draft.toastmasterId || draft.email || draft.username || draft.password || draft.adminName) {
      if (!draft.clubName || !draft.email || !draft.email.includes('@') || !draft.username || !draft.password) {
        setMessage(t.createClubHint)
        return
      }
      nextClubs = [...clubs, { ...draft, id: `club${Date.now()}` }]
      setClubs(nextClubs)
      onClubsChange?.(nextClubs)
      setDraft({ clubName: '', toastmasterId: '', email: '', username: '', password: '', adminName: '' })
    }
    localStorage.setItem('tm-master-clubs', JSON.stringify(nextClubs))
    setMessage(t.clubListSaved)
  }

  return (
    <div className="tm-main-column">
      <div className="tm-screen-head">
        <div>
          <h1>{t.masterTitle}</h1>
          <p>{t.masterSubtitle}</p>
        </div>
        <div className="tm-actions">
          <button className="tm-gold" onClick={createClub}>{t.createClub}</button>
          <button onClick={saveClubList}>{t.saveClubList}</button>
        </div>
      </div>
      {message && <div className="tm-sync-badge"><b>{message}</b></div>}
      <section className="tm-panel" id="tm-create-club-form">
        <div className="tm-panel-title">
          <span className="tm-icon">＋</span>
          <h2>{t.createClub}</h2>
        </div>
        <div className="tm-form-grid">
          <label>
            <span>{t.clubName}</span>
            <input value={draft.clubName} onChange={event => updateDraft('clubName', event.target.value)} />
          </label>
          <label>
            <span>{t.toastmasterId}</span>
            <input value={draft.toastmasterId} onChange={event => updateDraft('toastmasterId', event.target.value)} />
          </label>
          <label>
            <span>{t.email}</span>
            <input value={draft.email} onChange={event => updateDraft('email', event.target.value)} type="email" />
          </label>
          <label>
            <span>{t.userId}</span>
            <input value={draft.username} onChange={event => updateDraft('username', event.target.value)} />
          </label>
          <label>
            <span>{t.password}</span>
            <input type="password" value={draft.password} onChange={event => updateDraft('password', event.target.value)} />
          </label>
          <label>
            <span>{t.adminName}</span>
            <input value={draft.adminName} onChange={event => updateDraft('adminName', event.target.value)} />
          </label>
        </div>
      </section>
      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">☷</span>
          <h2>{t.clubList}</h2>
        </div>
        <div className="tm-master-list">
          <div>
            <span>{t.clubName}</span>
            <b>{settings.clubName || t.club}</b>
          </div>
          <div>
            <span>{t.toastmasterId}</span>
            <b>{settings.toastmasterId || t.pending}</b>
          </div>
          <div>
            <span>{t.clubAdmins}</span>
            <b>{admins.length}</b>
          </div>
        </div>
        <div className="tm-club-table">
          <div className="tm-club-table-head">
            <span>{t.clubName}</span>
            <span>{t.toastmasterId}</span>
            <span>{t.email}</span>
            <span>{t.userId}</span>
            <span>{t.password}</span>
            <span>{t.adminName}</span>
            <span>{t.action}</span>
          </div>
          {clubs.map(club => (
            <div className="tm-club-table-row" key={club.id}>
              <input value={club.clubName} onChange={event => updateClub(club.id, 'clubName', event.target.value)} />
              <input value={club.toastmasterId} onChange={event => updateClub(club.id, 'toastmasterId', event.target.value)} />
              <input value={club.email || ''} onChange={event => updateClub(club.id, 'email', event.target.value)} type="email" />
              <input value={club.username} onChange={event => updateClub(club.id, 'username', event.target.value)} />
              <input type="password" value={club.password} onChange={event => updateClub(club.id, 'password', event.target.value)} />
              <input value={club.adminName} onChange={event => updateClub(club.id, 'adminName', event.target.value)} />
              <button className="tm-danger" onClick={() => deleteClub(club.id)}>{t.remove}</button>
            </div>
          ))}
          {!clubs.length && <div className="tm-empty-row">{t.noClub}</div>}
        </div>
      </section>
      <section className="tm-panel tm-note-panel">
        <p>{t.masterNote}</p>
        <p>{t.accountNote}</p>
      </section>
    </div>
  )
}

function VoteCard({ title, candidates, selected, onSelect, prepared, t }) {
  return (
    <section className="tm-vote-card">
      <h2>{title}</h2>
      <div className="tm-vote-options">
        {candidates.map(item => (
          <button
            key={item.id}
            className={selected === item.id ? 'selected' : ''}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.name || t.unnamed}</span>
            {prepared && <small>{item.title}</small>}
          </button>
        ))}
      </div>
    </section>
  )
}

function VoteView({ data, setData, setView, t, spaceId }) {
  const [preparedPick, setPreparedPick] = useState('')
  const [impromptuPick, setImpromptuPick] = useState('')
  const [evaluatorPick, setEvaluatorPick] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const meetingVoteKey = getVoteInstanceKey(data, spaceId)
  const alreadyVoted = hasLocalVote(meetingVoteKey)
  const isOpen = ['open', '开放投票', '开放中'].includes(data.meeting.status)

  async function handleSubmitVote() {
    if (!preparedPick || !impromptuPick || !evaluatorPick || alreadyVoted) return
    setSubmitting(true)
    setError('')
    try {
      const voterToken = getOrCreateVoterToken(meetingVoteKey)
      const result = await submitVote(data, preparedPick, impromptuPick, evaluatorPick, voterToken)
      setData(result.data)
      markLocalVoted(meetingVoteKey)
      setView('success')
    } catch (err) {
      const message = err?.code === 'already_voted'
        ? t.duplicateVote
        : `${t.saveFailed} ${err?.message || ''}`.trim()
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="tm-vote-shell">
      <div className="tm-vote-hero">
        <p>{t.club}</p>
        <h1>{t.tonightVote}</h1>
        <span>{data.meeting.number} {t.regularMeeting} | {data.meeting.theme}</span>
      </div>

      {alreadyVoted ? (
        <div className="tm-success-card">
          <h2>{t.alreadyVoted}</h2>
          <p>{t.thanksJoin}</p>
        </div>
      ) : !isOpen ? (
        <div className="tm-success-card">
          <h2>{t.notOpen}</h2>
          <p>{t.waitOpen}</p>
        </div>
      ) : (
        <>
          <VoteCard title={t.prepared} candidates={data.prepared} selected={preparedPick} onSelect={setPreparedPick} prepared t={t} />
          <VoteCard title={t.impromptu} candidates={data.impromptu} selected={impromptuPick} onSelect={setImpromptuPick} t={t} />
          <VoteCard title={t.evaluator} candidates={data.evaluator} selected={evaluatorPick} onSelect={setEvaluatorPick} t={t} />
          <button className="tm-submit-vote" disabled={!preparedPick || !impromptuPick || !evaluatorPick || submitting} onClick={handleSubmitVote}>
            {submitting ? t.submitting : t.submit}
          </button>
          {error && <p className="tm-error">{error}</p>}
          <p className="tm-rule">{t.rule}</p>
        </>
      )}
    </div>
  )
}

function SharePoster({ data, t, voteLink }) {
  if (!isCloudConfigured) {
    return (
      <div className="tm-success-card">
        <h2>{t.cloudNotReadyTitle}</h2>
        <p>{t.cloudNotReadyAdmin}</p>
        <a className="tm-card-action" href={getSettingsUrl()}>{t.openSettings}</a>
      </div>
    )
  }

  return (
    <div className="tm-poster-wrap">
      <div className="tm-poster">
        <div className="tm-poster-top">
          <span>{t.clubShort}</span>
          <span>Toastmasters Club</span>
        </div>
        <p>{t.club}</p>
        <h1>{t.tonightVote}</h1>
        <h2>{data.meeting.number} {t.regularMeeting} | {data.meeting.theme}</h2>
        <div className="tm-poster-qr">
          <span>{t.scanVote}</span>
          <QrBlock value={voteLink} compact />
          <b>{voteLink}</b>
        </div>
        <button>{t.voteNow}</button>
        <div className="tm-poster-items">
          <strong>{t.prepared}</strong>
          <strong>{t.impromptu}</strong>
          <strong>{t.evaluator}</strong>
        </div>
        <div className="tm-poster-meta">
          <span>{t.date}: {data.meeting.date}</span>
          <span>{t.closeTime}: {data.meeting.closeTime}</span>
        </div>
        <footer>{t.rule}</footer>
      </div>
    </div>
  )
}

function ResultsView({ data, t }) {
  const preparedWinner = winner(data.prepared, t)
  const impromptuWinner = winner(data.impromptu, t)
  const evaluatorWinner = winner(data.evaluator, t)
  const maxPrepared = Math.max(1, ...data.prepared.map(item => item.votes))
  const maxImpromptu = Math.max(1, ...data.impromptu.map(item => item.votes))
  const maxEvaluator = Math.max(1, ...data.evaluator.map(item => item.votes))

  return (
    <div className="tm-results-grid">
      <section className="tm-panel">
        <h2>{t.realtime}</h2>
        <div className="tm-winner-row">
          <div><span>{t.bestPrepared}</span><b>{preparedWinner.label}</b><small>{preparedWinner.votes} {t.votes}</small></div>
          <div><span>{t.bestImpromptu}</span><b>{impromptuWinner.label}</b><small>{impromptuWinner.votes} {t.votes}</small></div>
          <div><span>{t.bestEvaluator}</span><b>{evaluatorWinner.label}</b><small>{evaluatorWinner.votes} {t.votes}</small></div>
        </div>
      </section>
      <section className="tm-panel">
        <h2>{t.preparedVotes}</h2>
        {data.prepared.map(item => <Bar key={item.id} item={item} max={maxPrepared} />)}
      </section>
      <section className="tm-panel">
        <h2>{t.impromptuVotes}</h2>
        {data.impromptu.map(item => <Bar key={item.id} item={item} max={maxImpromptu} />)}
      </section>
      <section className="tm-panel">
        <h2>{t.evaluatorVotes}</h2>
        {data.evaluator.map(item => <Bar key={item.id} item={item} max={maxEvaluator} />)}
      </section>
    </div>
  )
}

function Bar({ item, max }) {
  return (
    <div className="tm-bar-row">
      <span>{item.name}</span>
      <div><i style={{ width: `${(item.votes / max) * 100}%` }} /></div>
      <b>{item.votes}</b>
    </div>
  )
}

function timerRecordKey(meetingId, spaceId = '', clubId = 'default') {
  const scope = [spaceId || 'local', clubId || 'default', meetingId || 'current'].join('__')
  return `tm-timer-records-${scope}`
}

function parseTimerMinutes(value = '', fallback = 3) {
  const nums = String(value || '').match(/\d+(\.\d+)?/g)?.map(Number).filter(num => Number.isFinite(num)) || []
  if (!nums.length) return { min: fallback, yellow: fallback, red: fallback }
  if (nums.length === 1) return { min: Math.max(0, nums[0] * 0.8), yellow: Math.max(0, nums[0] * 0.9), red: nums[0] }
  const min = nums[0]
  const red = nums[nums.length - 1]
  const yellow = min + ((red - min) / 2)
  return { min, yellow, red }
}

function timerTargets(item = {}) {
  const key = canonicalAgendaRoleKey(item.roleName || item.id || '')
  const summary = String(item.summary || '')
  if (key.startsWith('prepared-') || /prepared|备稿/i.test(summary)) return parseTimerMinutes(item.duration || item.time, 7)
  if (key.startsWith('topics-') || /table topics speaker|即席讲员/i.test(summary)) return parseTimerMinutes(item.duration || item.time, 2)
  if (key.startsWith('evaluator-') || /^evaluator/i.test(item.roleName || '') || /evaluation|评论|评估/i.test(summary)) return parseTimerMinutes(item.duration || item.time, 3)
  return parseTimerMinutes(item.duration || item.time, 3)
}

function formatTimer(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatTargetMinutes(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function timerLight(elapsedSeconds, targets) {
  const elapsedMinutes = (elapsedSeconds || 0) / 60
  if (elapsedMinutes >= targets.red) return { key: 'red', label: 'Red', text: '红灯' }
  if (elapsedMinutes >= targets.yellow) return { key: 'yellow', label: 'Yellow', text: '黄灯' }
  if (elapsedMinutes >= targets.min) return { key: 'green', label: 'Green', text: '青灯' }
  return { key: 'idle', label: 'Ready', text: '准备' }
}

function hasAssignedMeetingRoles(roles = [], people = { members: [], guests: [] }) {
  return roles.some(role => personLabel(people, role.personType, role.personId))
}

function timerFallbackFromCandidates(data, people, lang = 'zh') {
  const candidateMembers = []
  const memberByName = new Map((people.members || []).map(item => [normalizeAgendaText(item.name), item]))
  const guestByName = new Map((people.guests || []).map(item => [normalizeAgendaText(item.name), item]))
  const ensurePerson = (name = '') => {
    const normalized = normalizeAgendaText(name)
    if (!normalized) return { personType: 'member', personId: '' }
    const member = memberByName.get(normalized)
    if (member) return { personType: 'member', personId: member.id }
    const guest = guestByName.get(normalized)
    if (guest) return { personType: 'guest', personId: guest.id }
    const synthetic = { id: `timer-candidate-${candidateMembers.length}`, name }
    candidateMembers.push(synthetic)
    return { personType: 'member', personId: synthetic.id }
  }
  const roleName = (zh, en) => (lang === 'en' ? en : zh)
  const roles = [
    ...(data.prepared || []).filter(item => item.name).map((item, index) => ({
      id: `timer-prepared-${index}`,
      roleName: roleName(`备稿讲员 ${index + 1}`, `Prepared Speaker ${index + 1}`),
      time: '7',
      ...ensurePerson(item.name),
    })),
    ...(data.impromptu || []).filter(item => item.name).map((item, index) => ({
      id: `timer-impromptu-${index}`,
      roleName: roleName(`即席讲员 ${index + 1}`, `Table Topics Speaker ${index + 1}`),
      time: '2',
      ...ensurePerson(item.name),
    })),
    ...(data.evaluator || []).filter(item => item.name).map((item, index) => ({
      id: `timer-evaluator-${index}`,
      roleName: roleName(`评论员 ${index + 1}`, `Evaluator ${index + 1}`),
      time: '3',
      ...ensurePerson(item.name),
    })),
  ]
  return {
    people: { ...people, members: [...(people.members || []), ...candidateMembers] },
    meetingOps: { attendance: [], roles },
  }
}

function TimerView({ data, people, meetingOps, settings, t, spaceId = '', clubId = 'default', publicTimer = false, timerLink = '', onCopyTimerLink = null }) {
  const uiLang = t.langLabel === 'Language' ? 'en' : 'zh'
  const timerSource = publicTimer && !hasAssignedMeetingRoles(meetingOps.roles, people)
    ? timerFallbackFromCandidates(data, people, uiLang)
    : { people, meetingOps }
  const agendaRows = standardAgendaScheduleRows(agendaRowsFromTemplate(settings, timerSource.meetingOps.roles), timerSource.people, data, uiLang)
  const flowItems = agendaRows.filter(item => !item.section)
  const firstId = flowItems[0]?.id || ''
  const [activeId, setActiveId] = useState(firstId)
  const [baseElapsed, setBaseElapsed] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [records, setRecords] = useState([])
  const [timerStatus, setTimerStatus] = useState('')
  const [timerFocus, setTimerFocus] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const activeItem = flowItems.find(item => item.id === activeId) || flowItems[0] || {}
  const activeTargets = timerTargets(activeItem)
  const elapsed = startedAt ? baseElapsed + ((now - startedAt) / 1000) : baseElapsed
  const light = timerLight(elapsed, activeTargets)
  const progress = Math.min(100, (elapsed / Math.max(1, activeTargets.red * 60)) * 100)
  const timerMeetingId = data.meeting?.id || getVoteInstanceKey(data, spaceId)
  const timerStorageKey = timerRecordKey(timerMeetingId, spaceId, clubId)

  useEffect(() => {
    if (!activeId && firstId) setActiveId(firstId)
  }, [activeId, firstId])

  useEffect(() => {
    if (!startedAt) return undefined
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [startedAt])

  useEffect(() => {
    let ignore = false
    async function hydrateTimerRecords() {
      try {
        const result = await loadTimerRecordsState(timerMeetingId, spaceId, clubId)
        if (!ignore) setRecords(result.data || [])
      } catch {
        if (!ignore) {
          try {
            setRecords(JSON.parse(localStorage.getItem(timerStorageKey) || '[]'))
          } catch {
            setRecords([])
          }
        }
      }
    }
    hydrateTimerRecords()
    setActiveId(firstId)
    setBaseElapsed(0)
    setStartedAt(null)
    return () => { ignore = true }
  }, [timerMeetingId, timerStorageKey, firstId, spaceId, clubId])

  function applyTimerLiveState(state = {}) {
    if (!state?.activeId) return
    const exists = flowItems.some(item => item.id === state.activeId)
    if (!exists) return
    setActiveId(state.activeId)
    setBaseElapsed(Number(state.baseElapsed) || 0)
    setStartedAt(state.startedAt ? new Date(state.startedAt).getTime() : null)
    setNow(Date.now())
    setTimerFocus(true)
  }

  async function publishTimerLiveState(nextState = {}) {
    try {
      await saveTimerLiveState(nextState, timerMeetingId, spaceId, clubId)
    } catch (err) {
      setTimerStatus(err.message || 'Timer sync failed')
    }
  }

  useEffect(() => {
    let ignore = false
    async function hydrateTimerLiveState() {
      try {
        const result = await loadTimerLiveState(timerMeetingId, spaceId, clubId)
        if (!ignore && result.data) applyTimerLiveState(result.data)
      } catch {
        // Timer can still run locally if live sync is unavailable.
      }
    }
    hydrateTimerLiveState()
    if (!publicTimer) return () => { ignore = true }
    const timer = setInterval(hydrateTimerLiveState, 2000)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [timerMeetingId, spaceId, clubId, publicTimer, firstId])

  function selectItem(id) {
    setActiveId(id)
    setBaseElapsed(0)
    setStartedAt(null)
    setNow(Date.now())
    setTimerFocus(true)
    publishTimerLiveState({ activeId: id, baseElapsed: 0, startedAt: '', status: 'selected' })
  }

  function startTimer() {
    if (!activeItem.id || startedAt) return
    const startTime = Date.now()
    setStartedAt(startTime)
    setNow(Date.now())
    publishTimerLiveState({
      activeId: activeItem.id,
      baseElapsed,
      startedAt: new Date(startTime).toISOString(),
      status: 'running',
    })
  }

  function pauseTimer() {
    if (!startedAt) return
    const pausedElapsed = elapsed
    setBaseElapsed(elapsed)
    setStartedAt(null)
    publishTimerLiveState({
      activeId: activeItem.id,
      baseElapsed: Math.round(pausedElapsed),
      startedAt: '',
      status: 'paused',
    })
  }

  function resetTimer() {
    setBaseElapsed(0)
    setStartedAt(null)
    setNow(Date.now())
    publishTimerLiveState({ activeId: activeItem.id, baseElapsed: 0, startedAt: '', status: 'idle' })
  }

  async function endTimer() {
    if (!activeItem.id) return
    const finalElapsed = elapsed
    const finalLight = timerLight(finalElapsed, activeTargets)
    const record = {
      id: `${activeItem.id}-${Date.now()}`,
      itemId: activeItem.id,
      itemType: canonicalAgendaRoleKey(activeItem.roleName || activeItem.id || ''),
      summary: activeItem.summary,
      person: activeItem.person,
      duration: activeItem.duration,
      elapsed: Math.round(finalElapsed),
      light: finalLight.key,
      lightLabel: uiLang === 'zh' ? finalLight.text : finalLight.label,
      startedAt: startedAt ? new Date(startedAt).toISOString() : '',
      endedAt: new Date().toISOString(),
    }
    const optimistic = [record, ...records].slice(0, 80)
    setRecords(optimistic)
    localStorage.setItem(timerStorageKey, JSON.stringify(optimistic))
    setTimerStatus('Saving...')
    try {
      const result = await saveTimerRecordState(record, timerMeetingId, spaceId, clubId)
      setRecords(result.data || optimistic)
      setTimerStatus(result.source === 'cloud' ? 'Saved' : 'Saved on this device')
    } catch (err) {
      setTimerStatus(err.message || 'Saved on this device')
    }
    resetTimer()
  }

  function nextItem() {
    const index = flowItems.findIndex(item => item.id === activeItem.id)
    const next = flowItems[index + 1]
    if (next) selectItem(next.id)
  }

  const categoryRows = [
    { title: t.prepared, rows: flowItems.filter(item => canonicalAgendaRoleKey(item.roleName).startsWith('prepared-') || /备稿|Prepared/i.test(item.summary)) },
    { title: t.impromptu, rows: flowItems.filter(item => canonicalAgendaRoleKey(item.roleName).startsWith('topics-') || /即席讲员|Table Topics Speaker/i.test(item.summary)) },
    { title: t.evaluator, rows: flowItems.filter(item => canonicalAgendaRoleKey(item.roleName).startsWith('evaluator-') || /^Evaluator/i.test(item.summary) || /评论 \d|Evaluator \d/i.test(item.summary)) },
  ]

  return (
    <div className="tm-main-column">
      <div className="tm-screen-head">
        <div>
          <h1>{t.navTimer}</h1>
          <p>{data.meeting.number || t.currentMeeting} {t.regularMeeting} | {data.meeting.date}</p>
          {timerStatus && <div className="tm-sync-badge"><b>{timerStatus}</b></div>}
          {!publicTimer && timerLink && <div className="tm-sync-badge"><b>{t.timerLink}</b><span>{timerLink}</span></div>}
        </div>
        {!publicTimer && timerLink && (
          <div className="tm-actions">
            <button onClick={() => {
              setCopyStatus(t.syncing)
              const action = onCopyTimerLink ? onCopyTimerLink() : copyText(timerLink)
              action.then(() => setCopyStatus(t.copied)).catch(err => setCopyStatus(err.message || t.saveFailed))
            }}>{copyStatus || t.copyTimerLink}</button>
          </div>
        )}
      </div>

      <div className={`tm-timer-layout ${timerFocus ? 'timer-focus' : ''}`}>
        <section className="tm-panel tm-timer-flow">
          <div className="tm-panel-title">
            <span className="tm-icon">⏱</span>
            <h2>会议流程控制</h2>
          </div>
          <div className="tm-timer-flow-list">
            {agendaRows.map(item => item.section ? (
              <div key={item.id} className="tm-timer-section">{item.section}</div>
            ) : (
              <button key={item.id} className={activeItem.id === item.id ? 'active' : ''} onClick={() => selectItem(item.id)}>
                <b>{item.time}</b>
                <span>{item.summary}</span>
                <small>{item.person || t.pending} · {item.duration} min</small>
              </button>
            ))}
          </div>
        </section>

        <section className="tm-panel tm-timer-stage">
          <div className={`tm-timer-light ${light.key}`}>
            <span>{uiLang === 'zh' ? light.text : light.label}</span>
          </div>
          <div className="tm-timer-active">
            <span>{activeItem.time || '--:--'}</span>
            <h2>{activeItem.summary || '请选择流程'}</h2>
            <p>{activeItem.person || t.pending}</p>
          </div>
          <div className="tm-timer-clock">{formatTimer(elapsed)}</div>
          <div className="tm-timer-progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="tm-timer-targets">
            <div><b>青灯</b><span>{formatTargetMinutes(activeTargets.min)} min</span></div>
            <div><b>黄灯</b><span>{formatTargetMinutes(activeTargets.yellow)} min</span></div>
            <div><b>红灯</b><span>{formatTargetMinutes(activeTargets.red)} min</span></div>
          </div>
          <div className="tm-timer-actions">
            <button className="tm-mobile-only" onClick={() => setTimerFocus(false)}>选择流程</button>
            <button className="tm-gold" onClick={startTimer} disabled={!!startedAt}>{startedAt ? '进行中' : '开始'}</button>
            <button onClick={pauseTimer} disabled={!startedAt}>暂停</button>
            <button onClick={endTimer}>结束并记录</button>
            <button onClick={resetTimer}>重置</button>
            <button onClick={nextItem}>下一流程</button>
          </div>
        </section>
      </div>

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">▦</span>
          <h2>备稿 / 即席 / 评估计时</h2>
        </div>
        <div className="tm-timer-category-grid">
          {categoryRows.map(group => (
            <div key={group.title} className="tm-timer-category">
              <h3>{group.title}</h3>
              {group.rows.length ? group.rows.map(item => (
                <button key={item.id} className={activeItem.id === item.id ? 'active' : ''} onClick={() => selectItem(item.id)}>
                  <b>{item.person || t.pending}</b>
                  <span>{item.summary}</span>
                  <small>{item.duration} min</small>
                </button>
              )) : <p>{t.pending}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">✓</span>
          <h2>计时记录</h2>
        </div>
        <div className="tm-timer-records">
          {records.length ? records.map(record => (
            <div key={record.id} className="tm-timer-record">
              <b>{record.summary}</b>
              <span>{record.person || t.pending}</span>
              <small>{formatTimer(record.elapsed)} · {record.lightLabel}</small>
            </div>
          )) : <p>{t.pending}</p>}
        </div>
      </section>
    </div>
  )
}

function HistoryView({ data, t }) {
  const historyWinner = value => value === 'Tied' ? t.tied : value || t.pending
  const currentRecord = {
    id: data.meeting.id,
    meeting: data.meeting.number,
    date: data.meeting.date,
    preparedWinner: winner(data.prepared, t).label,
    preparedVotes: winner(data.prepared, t).votes,
    impromptuWinner: winner(data.impromptu, t).label,
    impromptuVotes: winner(data.impromptu, t).votes,
    evaluatorWinner: winner(data.evaluator, t).label,
    evaluatorVotes: winner(data.evaluator, t).votes,
  }
  const currentKey = `${currentRecord.id || ''}|${currentRecord.meeting}|${currentRecord.date}`
  const records = [
    currentRecord,
    ...data.history.filter(record => {
      const recordKey = `${record.id || ''}|${record.meeting}|${record.date}`
      return recordKey !== currentKey
    }),
  ]

  return (
    <section className="tm-panel">
      <h2>{t.historyDb}</h2>
      <div className="tm-history-list">
        {records.map(record => (
          <div key={`${record.id || record.meeting}-${record.date}`} className="tm-history-card">
            <strong>{record.meeting}</strong>
            <span>{record.date}</span>
            <p>{t.bestPrepared}: {historyWinner(record.preparedWinner)} ({record.preparedVotes} {t.votes})</p>
            <p>{t.bestImpromptu}: {historyWinner(record.impromptuWinner)} ({record.impromptuVotes} {t.votes})</p>
            <p>{t.bestEvaluator}: {historyWinner(record.evaluatorWinner)} ({record.evaluatorVotes} {t.votes})</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PeopleView({ people, setPeople, persistPeople, syncStatus, t }) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [actionStatus, setActionStatus] = useState('')
  const [peopleSearch, setPeopleSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pathwayFilter, setPathwayFilter] = useState('all')
  const pathwayOptions = [...new Set(people.members.map(item => item.pathway).filter(Boolean))].sort()
  const normalizedSearch = normalizePersonName(peopleSearch)
  const visibleMembers = people.members.filter(item => {
    const searchable = normalizePersonName([item.name, item.englishName, item.email, item.phone, item.toastmastersId, item.memberId, item.pathway, item.currentProject].filter(Boolean).join(' '))
    const statusOk = statusFilter === 'all' || (item.status || 'active') === statusFilter
    const pathwayOk = pathwayFilter === 'all' || item.pathway === pathwayFilter
    return (!normalizedSearch || searchable.includes(normalizedSearch)) && statusOk && pathwayOk
  })
  const visibleGuests = people.guests.filter(item => {
    const searchable = normalizePersonName([item.name, item.email, item.phone, item.introducedBy, item.notes].filter(Boolean).join(' '))
    return !normalizedSearch || searchable.includes(normalizedSearch)
  })

  function updateMember(id, field, value) {
    setPeople({
      ...people,
      members: people.members.map(item => item.id === id ? { ...item, [field]: value } : item),
    })
  }

  function updateGuest(id, field, value) {
    setPeople({
      ...people,
      guests: people.guests.map(item => item.id === id ? { ...item, [field]: value } : item),
    })
  }

  function addMember() {
    setPeople({
      ...people,
      members: [
        ...people.members,
        {
          id: `m${Date.now()}`,
          memberId: '',
          name: '',
          englishName: '',
          toastmastersId: '',
          email: '',
          phone: '',
          pathway: '',
          level: '',
          currentProject: '',
          mentor: '',
          officerRole: '',
          birthday: '',
          status: 'active',
          joinedDate: '',
        },
      ],
    })
  }

  function addGuest() {
    setPeople({
      ...people,
      guests: [
        ...people.guests,
        {
          id: `g${Date.now()}`,
          name: '',
          email: '',
          phone: '',
          introducedBy: '',
          visitDate: '',
          notes: '',
        },
      ],
    })
  }

  function removeMember(id) {
    setPeople({ ...people, members: people.members.filter(item => item.id !== id) })
  }

  function removeGuest(id) {
    setPeople({ ...people, guests: people.guests.filter(item => item.id !== id) })
  }

  function convertGuestToMember(guest) {
    const normalizedName = normalizePersonName(guest.name)
    if (!normalizedName || people.members.some(item => normalizePersonName(item.name) === normalizedName)) return
    setPeople({
      members: [
        ...people.members,
        {
          id: `m${Date.now()}`,
          memberId: '',
          name: guest.name || '',
          englishName: '',
          toastmastersId: '',
          email: guest.email || '',
          phone: guest.phone || '',
          pathway: '',
          level: '',
          currentProject: '',
          mentor: guest.introducedBy || '',
          officerRole: '',
          birthday: '',
          status: 'active',
          joinedDate: '',
          notes: guest.notes || '',
        },
      ],
      guests: people.guests.filter(item => item.id !== guest.id),
    })
  }

  function importChungHwaList() {
    const mergeByName = (current, incoming, prefix) => {
      const existingNames = new Set(current.map(item => item.name))
      const additions = incoming
        .filter(item => item.name && !existingNames.has(item.name))
        .map((item, index) => ({ ...item, id: `${prefix}${Date.now()}${index}` }))
      return [...current, ...additions]
    }

    setPeople({
      members: mergeByName(people.members, seedPeopleState.members, 'm'),
      guests: mergeByName(people.guests, seedPeopleState.guests, 'g'),
    })
  }

  function applyPeopleImport() {
    const parsed = parsePeoplePaste(importText)
    const currentMemberNames = new Set(people.members.map(item => normalizePersonName(item.name)))
    const currentGuestNames = new Set(people.guests.map(item => normalizePersonName(item.name)))
    const newMembers = []
    const newGuests = []

    parsed.forEach((item, index) => {
      const normalizedName = normalizePersonName(item.name)
      if (!normalizedName || currentMemberNames.has(normalizedName) || currentGuestNames.has(normalizedName)) return
      if (item.type === 'guest') {
        currentGuestNames.add(normalizedName)
        newGuests.push({
          id: `g${Date.now()}${index}`,
          name: item.name,
          email: item.email || '',
          phone: item.phone || '',
          introducedBy: '',
          visitDate: '',
          notes: item.notes || '',
        })
      } else {
        currentMemberNames.add(normalizedName)
        newMembers.push({
          id: `m${Date.now()}${index}`,
          memberId: item.memberId || '',
          name: item.name,
          englishName: item.englishName || '',
          toastmastersId: item.toastmastersId || '',
          email: item.email || '',
          phone: item.phone || '',
          pathway: item.pathway || '',
          level: item.level || '',
          currentProject: item.currentProject || '',
          mentor: item.mentor || '',
          officerRole: item.officerRole || '',
          birthday: item.birthday || '',
          status: 'active',
          joinedDate: '',
        })
      }
    })

    setPeople({
      ...people,
      members: [...people.members, ...newMembers],
      guests: [...people.guests, ...newGuests],
    })
    setImportOpen(false)
    setImportText('')
  }

  function savePeopleWithFeedback() {
    setActionStatus(t.saveNow)
    Promise.resolve(persistPeople(people))
      .then(() => setActionStatus(t.peopleSaved || t.saved))
      .catch(err => setActionStatus(err.message || t.saveFailed))
  }

  return (
    <div className="tm-main-column">
      <div className="tm-screen-head">
        <div>
          <h1>{t.navPeople}</h1>
          <p>{t.privateSpace}</p>
          {actionStatus && <div className="tm-sync-badge"><b>{actionStatus}</b></div>}
          {syncStatus && <div className="tm-sync-badge"><b>{syncStatus}</b></div>}
        </div>
        <div className="tm-actions">
          <button className="tm-gold" onClick={savePeopleWithFeedback}>{actionStatus === t.saveNow ? t.saveNow : t.save}</button>
          <button onClick={() => setImportOpen(true)}>{t.importWhatsappList}</button>
          <button onClick={importChungHwaList}>{t.importChungHwaList}</button>
          <button onClick={addMember}>{t.addMember}</button>
          <button onClick={addGuest}>{t.addGuest}</button>
        </div>
      </div>

      <section className="tm-panel tm-people-controls">
        <div className="tm-kpi-row">
          <div><b>{people.members.length}</b><span>{t.membersTitle}</span></div>
          <div><b>{people.members.filter(item => item.status !== 'inactive').length}</b><span>{t.activeMembers}</span></div>
          <div><b>{people.guests.length}</b><span>{t.guestCount}</span></div>
        </div>
        <div className="tm-filter-row">
          <input value={peopleSearch} onChange={event => setPeopleSearch(event.target.value)} placeholder={t.search} />
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">{t.allStatus}</option>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
          </select>
          <select value={pathwayFilter} onChange={event => setPathwayFilter(event.target.value)}>
            <option value="all">{t.allPathways}</option>
            {pathwayOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </section>

      {importOpen && (
        <div className="tm-modal-backdrop">
          <div className="tm-modal">
            <h2>{t.pastePeopleList}</h2>
            <p>{t.pastePeopleListHint}</p>
            <p className="tm-muted">{t.importAsMemberHint}</p>
            <textarea
              value={importText}
              onChange={event => setImportText(event.target.value)}
              rows={12}
              placeholder={'1. Jenny 🆓\n2. Kenny ✅RM60\n3. Alice Guest RM30'}
            />
            <div className="tm-modal-actions">
              <button onClick={applyPeopleImport} disabled={!importText.trim()}>{t.applyImport}</button>
              <button className="tm-outline" onClick={() => setImportOpen(false)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">👥</span>
          <h2>{t.membersTitle}</h2>
        </div>
        <div className="tm-directory-table members">
          <div className="tm-directory-head">
            <span>{t.memberId}</span>
            <span>{t.name}</span>
            <span>{t.englishName}</span>
            <span>{t.toastmastersId}</span>
            <span>{t.pathway}</span>
            <span>{t.level}</span>
            <span>{t.currentProject}</span>
            <span>{t.mentor}</span>
            <span>{t.officerRole}</span>
            <span>{t.email}</span>
            <span>{t.phone}</span>
            <span>{t.joinedDate}</span>
            <span>{t.birthday}</span>
            <span>{t.status}</span>
            <span>{t.action}</span>
          </div>
          {visibleMembers.map(item => (
            <div className="tm-directory-row" key={item.id}>
              <input value={item.memberId || ''} onChange={e => updateMember(item.id, 'memberId', e.target.value)} />
              <input value={item.name || ''} onChange={e => updateMember(item.id, 'name', e.target.value)} />
              <input value={item.englishName || ''} onChange={e => updateMember(item.id, 'englishName', e.target.value)} />
              <input value={item.toastmastersId || ''} onChange={e => updateMember(item.id, 'toastmastersId', e.target.value)} />
              <input value={item.pathway || ''} onChange={e => updateMember(item.id, 'pathway', e.target.value)} />
              <input value={item.level || ''} onChange={e => updateMember(item.id, 'level', e.target.value)} />
              <input value={item.currentProject || ''} onChange={e => updateMember(item.id, 'currentProject', e.target.value)} />
              <input value={item.mentor || ''} onChange={e => updateMember(item.id, 'mentor', e.target.value)} />
              <input value={item.officerRole || ''} onChange={e => updateMember(item.id, 'officerRole', e.target.value)} />
              <input value={item.email || ''} onChange={e => updateMember(item.id, 'email', e.target.value)} />
              <input value={item.phone || ''} onChange={e => updateMember(item.id, 'phone', e.target.value)} />
              <input value={item.joinedDate || ''} onChange={e => updateMember(item.id, 'joinedDate', e.target.value)} />
              <input value={item.birthday || ''} onChange={e => updateMember(item.id, 'birthday', e.target.value)} />
              <select value={item.status || 'active'} onChange={e => updateMember(item.id, 'status', e.target.value)}>
                <option value="active">{t.active}</option>
                <option value="inactive">{t.inactive}</option>
              </select>
              <button className="tm-danger" onClick={() => removeMember(item.id)}>{t.remove}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="tm-panel">
        <div className="tm-panel-title">
          <span className="tm-icon">🙋</span>
          <h2>{t.guestsTitle}</h2>
        </div>
        <div className="tm-directory-table guests">
          <div className="tm-directory-head">
            <span>{t.name}</span>
            <span>{t.email}</span>
            <span>{t.phone}</span>
            <span>{t.introducedBy}</span>
            <span>{t.visitDate}</span>
            <span>{t.notes}</span>
            <span>{t.action}</span>
          </div>
          {visibleGuests.map(item => (
            <div className="tm-directory-row" key={item.id}>
              <input value={item.name || ''} onChange={e => updateGuest(item.id, 'name', e.target.value)} />
              <input value={item.email || ''} onChange={e => updateGuest(item.id, 'email', e.target.value)} />
              <input value={item.phone || ''} onChange={e => updateGuest(item.id, 'phone', e.target.value)} />
              <input value={item.introducedBy || ''} onChange={e => updateGuest(item.id, 'introducedBy', e.target.value)} />
              <input value={item.visitDate || ''} onChange={e => updateGuest(item.id, 'visitDate', e.target.value)} />
              <input value={item.notes || ''} onChange={e => updateGuest(item.id, 'notes', e.target.value)} />
              <div className="tm-row-actions">
                <button onClick={() => convertGuestToMember(item)}>{t.convertToMember}</button>
                <button className="tm-danger" onClick={() => removeGuest(item.id)}>{t.remove}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function normalizePersonName(name = '') {
  return String(name || '').replace(/\s+/g, '').toLowerCase()
}

function cleanImportedName(raw = '') {
  return String(raw || '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[✅☑️✔️🆓❣️❤️💰📅🕚🌍]/g, ' ')
    .replace(/\bRM\s*\d+(?:\.\d+)?\b/gi, ' ')
    .replace(/\+\s*\d+/g, ' ')
    .replace(/[【\[].*?[】\]]/g, ' ')
    .replace(/[()（）].*?[()）]/g, ' ')
    .replace(/[：:，,;；|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePeoplePaste(text = '') {
  const records = []
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  lines.forEach(line => {
    const withoutNumber = line
      .replace(/^\s*\d+\s*[.)、．]?\s*/g, '')
      .replace(/^\s*[-*•]\s*/g, '')
      .replace(/^\s*[⁠\u200b\u200c\u200d]+\s*/g, '')
      .trim()
    if (!withoutNumber) return
    const email = withoutNumber.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''
    const phone = withoutNumber.match(/(?:\+?6?0|01)\d[\d -]{6,}/)?.[0]?.trim() || ''
    const toastmastersId = withoutNumber.match(/\b(?:tm|toastmasters?)\s*id\s*[:：]?\s*([A-Z0-9-]+)/i)?.[1] || ''
    const pathway = withoutNumber.match(/\b(?:pathway|pathways?)\s*[:：]?\s*([^,，|]+)/i)?.[1]?.trim() || ''
    const levelRaw = withoutNumber.match(/\b(?:level|lvl|l)\s*[:：]?\s*([1-5]|L[1-5])\b/i)?.[1] || ''
    const level = levelRaw ? String(levelRaw).toUpperCase().replace(/^([1-5])$/, 'L$1') : ''
    const guestLike = /嘉宾|嘉賓|来宾|來賓|guest|visitor|来访|來訪|rm\s*\d+|✅/i.test(withoutNumber)
    const memberLike = /会员|會員|member|free|免费|免費|🆓/i.test(withoutNumber)
    const type = guestLike && !memberLike ? 'guest' : 'member'
    const namePart = withoutNumber
      .replace(email, '')
      .replace(phone, '')
      .split(/✅|🆓|RM\s*\d+|rm\s*\d+|会员|會員|嘉宾|嘉賓|guest|visitor|来宾|來賓/i)[0]
    const name = cleanImportedName(namePart)
    if (!name || /^\d+$/.test(name)) return
    records.push({
      type,
      name,
      email,
      phone,
      toastmastersId,
      pathway,
      level,
      notes: type === 'guest' ? withoutNumber : '',
    })
  })

  return records
}

function personLabel(people, type, id) {
  const list = type === 'guest' ? people.guests : people.members
  return list.find(item => item.id === id)?.name || ''
}

function PersonSelect({ people, personType, personId, onChange, t, disabled = false }) {
  const list = personType === 'guest' ? people.guests : people.members

  return (
    <div className="tm-person-select">
      <select disabled={disabled} value={personType} onChange={event => onChange(event.target.value, '')}>
        <option value="member">{t.member}</option>
        <option value="guest">{t.guest}</option>
      </select>
      <select disabled={disabled} value={personId} onChange={event => onChange(personType, event.target.value)}>
        <option value="">{t.name}</option>
        {list.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </div>
  )
}

function fullToastmastersRoles(_settings, lang = 'zh') {
  const nonRolePattern = /invocation|pledge|guest introduction|word of the day|timer report|ah counter report|grammarian report|awards presentation|president closing/i
  const englishRoles = [
    { roleName: 'Evaluator 1', time: '3' },
    { roleName: 'Evaluator 2', time: '3' },
    { roleName: 'Evaluator 3', time: '3' },
    { roleName: 'Table Topics Master', time: '20' },
    { roleName: 'Sergeant at Arms', time: '3' },
    { roleName: 'President', time: '5' },
    { roleName: 'Toastmaster of the Evening', time: '5' },
    { roleName: 'Timer', time: '3' },
    { roleName: 'Ah Counter', time: '3' },
    { roleName: 'Grammarian', time: '5' },
    { roleName: 'Prepared Speaker 1', time: '7' },
    { roleName: 'Prepared Speaker 2', time: '7' },
    { roleName: 'Table Topics Speaker 1', time: '2' },
    { roleName: 'Table Topics Speaker 2', time: '2' },
    { roleName: 'Table Topics Speaker 3', time: '2' },
    { roleName: 'Table Topics Speaker 4', time: '2' },
    { roleName: 'General Evaluator', time: '10' },
    { roleName: 'Technical Manager', time: '15' },
    { roleName: 'Registration and Networking', time: '5' },
  ]
  const chineseRoles = [
    { roleName: '评论员 1', time: '3' },
    { roleName: '评论员 2', time: '3' },
    { roleName: '评论员 3', time: '3' },
    { roleName: '即席主持人', time: '20' },
    { roleName: '礼宾司', time: '3' },
    { roleName: '会长', time: '5' },
    { roleName: '例会主持人', time: '5' },
    { roleName: '计时员', time: '3' },
    { roleName: '尾音计算员', time: '3' },
    { roleName: '语言评论员', time: '5' },
    { roleName: '备稿讲员 1', time: '7' },
    { roleName: '备稿讲员 2', time: '7' },
    { roleName: '即席讲员 1', time: '2' },
    { roleName: '即席讲员 2', time: '2' },
    { roleName: '即席讲员 3', time: '2' },
    { roleName: '即席讲员 4', time: '2' },
    { roleName: '总评论', time: '10' },
    { roleName: '技术经理', time: '15' },
    { roleName: '登记与交流', time: '5' },
  ]
  const fallbackRoles = lang === 'zh' ? chineseRoles : englishRoles
  const sourceRoles = fallbackRoles.filter(role => !nonRolePattern.test(role.roleName || ''))
  return sourceRoles.map((role, index) => {
    const templateRole = typeof role === 'string' ? { roleName: role, time: '' } : role
    return {
      id: `r${Date.now()}${index}`,
      roleName: localizedRoleName(templateRole.roleName, lang),
      time: templateRole.time || '',
      personType: 'member',
      personId: '',
    }
  })
}

function candidatesFromMeetingRoles(roles, people, existingData) {
  const toName = role => personLabel(people, role.personType, role.personId)
  const existingPreparedByName = new Map((existingData.prepared || []).map(item => [normalizeAgendaText(item.name), item]))
  const toCandidate = (role, prefix, index) => ({
    id: `${prefix}${Date.now()}${index}`,
    name: toName(role),
    votes: 0,
  })
  const prepared = roles
    .filter(role => roleCategory(role.roleName) === 'prepared' && toName(role))
    .map((role, index) => ({
      ...toCandidate(role, 'p', index),
      title: role.title || existingPreparedByName.get(normalizeAgendaText(toName(role)))?.title || '',
      project: role.project || existingPreparedByName.get(normalizeAgendaText(toName(role)))?.project || '',
    }))
  const impromptu = roles
    .filter(role => roleCategory(role.roleName) === 'impromptu' && toName(role))
    .map((role, index) => toCandidate(role, 'i', index))
  const evaluator = roles
    .filter(role => roleCategory(role.roleName) === 'evaluator' && toName(role))
    .map((role, index) => toCandidate(role, 'e', index))

  return {
    ...existingData,
    prepared: prepared.length ? prepared : existingData.prepared,
    impromptu: impromptu.length ? impromptu : existingData.impromptu,
    evaluator: evaluator.length ? evaluator : existingData.evaluator,
  }
}

function agendaRowsFromTemplate(settings, roles = []) {
  const nonRolePattern = /invocation|pledge|guest introduction|word of the day|timer report|ah counter report|grammarian report|awards presentation|president closing/i
  const roleMap = new Map()
  ;(roles || []).forEach(role => {
    const key = canonicalAgendaRoleKey(role.roleName)
    if (!key) return
    const current = roleMap.get(key)
    const roleHasData = Boolean(role.personId || role.title || role.project || role.time)
    const currentHasPerson = Boolean(current?.personId)
    if (!current || (roleHasData && !currentHasPerson) || (role.personId && !current.personId)) roleMap.set(key, role)
  })
  const template = (settings.agendaRoleTemplate || [])
    .filter(Boolean)
    .map(role => (typeof role === 'string' ? { roleName: role, time: '' } : role))
    .filter(role => !nonRolePattern.test(role.roleName || ''))
  const usingTemplate = template.length > 0
  const source = usingTemplate ? template : roles
  const seen = new Set()
  return source
    .map((role, index) => ({ role: typeof role === 'string' ? { roleName: role, time: '' } : role, index }))
    .filter(({ role }) => {
      const key = canonicalAgendaRoleKey(role.roleName)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => agendaRoleOrder(a.role.roleName) - agendaRoleOrder(b.role.roleName) || a.index - b.index)
    .map(({ role: templateRole }, index) => {
    const assignedRole = roleMap.get(canonicalAgendaRoleKey(templateRole.roleName)) || (usingTemplate ? {} : roles[index]) || {}
    return {
      id: assignedRole.id || `${templateRole.roleName}-${index}`,
      roleName: templateRole.roleName || assignedRole.roleName || '',
      time: assignedRole.time || templateRole.time || '',
      personType: assignedRole.personType || 'member',
      personId: assignedRole.personId || '',
      title: assignedRole.title || templateRole.title || '',
      project: assignedRole.project || templateRole.project || '',
    }
  })
}

function canonicalAgendaRoleKey(roleName = '') {
  const text = normalizeAgendaText(roleName)
  if (!text) return ''
  if (text.includes('registration') || text.includes('networking') || text.includes('登记') || text.includes('交流')) return 'registration'
  if (text.includes('table topics evaluation') || text.includes('table topics evaluator') || text.includes('即席评论员') || text.includes('即席评论')) return 'topics-evaluator'
  if (text.includes('sergeant') || text.includes('礼宾司')) return 'sergeant'
  if (text.includes('president') || text.includes('会长')) return 'president'
  if (text.includes('toastmaster of the evening') || text.includes('例会主持') || text.includes('司仪')) return 'toastmaster'
  if (text === 'timer' || text.includes('timer') || text.includes('计时员')) return 'timer'
  if (text.includes('ah counter') || text.includes('尾音')) return 'ah-counter'
  if (text.includes('grammarian') || text.includes('语言评论')) return 'grammarian'
  if (text.includes('prepared speaker 1') || text.includes('备稿讲员 1') || text.includes('备稿讲员1')) return 'prepared-1'
  if (text.includes('prepared speaker 2') || text.includes('备稿讲员 2') || text.includes('备稿讲员2')) return 'prepared-2'
  if (text.includes('prepared speaker 3') || text.includes('备稿讲员 3') || text.includes('备稿讲员3')) return 'prepared-3'
  if (text.includes('prepared speaker 4') || text.includes('备稿讲员 4') || text.includes('备稿讲员4')) return 'prepared-4'
  if (text.includes('evaluator 1') || text.includes('评论员 1') || text.includes('评论员1')) return 'evaluator-1'
  if (text.includes('evaluator 2') || text.includes('评论员 2') || text.includes('评论员2')) return 'evaluator-2'
  if (text.includes('evaluator 3') || text.includes('评论员 3') || text.includes('评论员3')) return 'evaluator-3'
  if (text.includes('evaluator 4') || text.includes('评论员 4') || text.includes('评论员4')) return 'evaluator-4'
  if (text.includes('table topics master') || text.includes('即席主持')) return 'topics-master'
  if (text.includes('table topics speaker 1') || text.includes('即席讲员 1') || text.includes('即席讲员1')) return 'topics-1'
  if (text.includes('table topics speaker 2') || text.includes('即席讲员 2') || text.includes('即席讲员2')) return 'topics-2'
  if (text.includes('table topics speaker 3') || text.includes('即席讲员 3') || text.includes('即席讲员3')) return 'topics-3'
  if (text.includes('table topics speaker 4') || text.includes('即席讲员 4') || text.includes('即席讲员4')) return 'topics-4'
  if (text.includes('general evaluator') || text.includes('总评论')) return 'general-evaluator'
  if (text.includes('technical') || text.includes('技术经理') || text.includes('技术')) return 'technical'
  return text
}

function localizedRoleName(roleName = '', lang = 'zh') {
  const key = canonicalAgendaRoleKey(roleName)
  const zhNames = {
    registration: '登记与交流',
    sergeant: '礼宾司',
    president: '会长',
    toastmaster: '例会主持人',
    timer: '计时员',
    'ah-counter': '尾音计算员',
    grammarian: '语言评论员',
    'prepared-1': '备稿讲员 1',
    'prepared-2': '备稿讲员 2',
    'prepared-3': '备稿讲员 3',
    'prepared-4': '备稿讲员 4',
    'evaluator-1': '评论员 1',
    'evaluator-2': '评论员 2',
    'evaluator-3': '评论员 3',
    'evaluator-4': '评论员 4',
    'topics-master': '即席主持人',
    'topics-1': '即席讲员 1',
    'topics-2': '即席讲员 2',
    'topics-3': '即席讲员 3',
    'topics-4': '即席讲员 4',
    'general-evaluator': '总评论',
    technical: '技术经理',
  }
  const enNames = {
    registration: 'Registration and Networking',
    sergeant: 'Sergeant at Arms',
    president: 'President',
    toastmaster: 'Toastmaster of the Evening',
    timer: 'Timer',
    'ah-counter': 'Ah Counter',
    grammarian: 'Grammarian',
    'prepared-1': 'Prepared Speaker 1',
    'prepared-2': 'Prepared Speaker 2',
    'prepared-3': 'Prepared Speaker 3',
    'prepared-4': 'Prepared Speaker 4',
    'evaluator-1': 'Evaluator 1',
    'evaluator-2': 'Evaluator 2',
    'evaluator-3': 'Evaluator 3',
    'evaluator-4': 'Evaluator 4',
    'topics-master': 'Table Topics Master',
    'topics-1': 'Table Topics Speaker 1',
    'topics-2': 'Table Topics Speaker 2',
    'topics-3': 'Table Topics Speaker 3',
    'topics-4': 'Table Topics Speaker 4',
    'general-evaluator': 'General Evaluator',
    technical: 'Technical Manager',
  }
  if (lang === 'bi') return `${zhNames[key] || roleName} / ${enNames[key] || roleName}`
  if (lang !== 'zh') return enNames[key] || roleName
  return zhNames[key] || roleName
}

function agendaRoleOrder(roleName = '') {
  const order = [
    'technical',
    'registration',
    'sergeant',
    'president',
    'toastmaster',
    'timer',
    'ah-counter',
    'grammarian',
    'prepared-1',
    'prepared-2',
    'prepared-3',
    'prepared-4',
    'topics-master',
    'topics-1',
    'topics-2',
    'topics-3',
    'topics-4',
    'evaluator-1',
    'evaluator-2',
    'evaluator-3',
    'evaluator-4',
    'general-evaluator',
  ]
  const index = order.indexOf(canonicalAgendaRoleKey(roleName))
  return index >= 0 ? index : order.length + 100
}

function minutesFromRoleTime(value = '') {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : 3
}

const DEFAULT_AGENDA_START_MINUTES = 19 * 60 + 15

function formatAgendaTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const hour12 = hours > 12 ? hours - 12 : hours
  return `${hour12}:${String(minutes).padStart(2, '0')}PM`
}

function agendaRoleSummary(role, people, data, lang = 'zh') {
  if (lang === 'bi') return `${agendaRoleSummary(role, people, data, 'zh')} / ${agendaRoleSummary(role, people, data, 'en')}`
  const roleName = role.roleName || ''
  const roleKey = canonicalAgendaRoleKey(roleName)
  const displayName = localizedRoleName(roleName, lang)
  const person = personLabel(people, role.personType, role.personId)
  const speaker = [...(data.prepared || []), ...(data.impromptu || []), ...(data.evaluator || [])]
    .find(item => item.name && item.name === person)
  const normalized = normalizeAgendaText(roleName)
  const en = lang !== 'zh'
  if (roleKey.startsWith('prepared-') || /prepared speaker/i.test(roleName)) {
    const title = (role.title || speaker?.title || '').trim()
    const project = (role.project || speaker?.project || '').trim()
    if (title && project) return en ? `${project} | Title: ${title}` : `${project}\uff5c\u9898\u76ee\uff1a${title}`
    if (title) return en ? `Title: ${title}` : `\u9898\u76ee\uff1a${title}`
    if (project) return project
    return displayName
  }
  if (roleKey.startsWith('prepared-') || /prepared speaker/i.test(roleName)) {
    const title = speaker?.title?.trim()
    if (title) return en ? `Title: ${title}` : `题目：${title}`
    return displayName
  }
  if (/toastmaster of the evening/i.test(roleName)) return en ? 'Introduce the meeting program' : '司仪介绍节目流程'
  if (/sergeant/i.test(roleName)) return en ? 'Sergeant at Arms welcome' : '礼宾司致欢迎词'
  if (/president/i.test(roleName)) return en ? 'President opening address' : '会长致开会词'
  if (/timer/i.test(roleName)) return en ? 'Timer explains timing rules' : '计时员说明时间规则'
  if (/ah counter/i.test(roleName)) return en ? 'Ah Counter explains rules' : '尾音计算员说明规则'
  if (/grammarian/i.test(roleName)) return en ? 'Grammarian introduces Word of the Day' : '语言评论员介绍每日一词'
  if (/table topics master/i.test(roleName)) return en ? 'Table Topics session' : '即席演讲环节'
  if (roleKey.startsWith('topics-') || /table topics speaker/i.test(roleName)) return displayName
  if (/general evaluator/i.test(roleName)) return en ? 'General Evaluation' : '总评论'
  if (roleKey.startsWith('evaluator-') || /^evaluator/i.test(roleName)) return speaker?.title ? `${en ? 'Evaluation' : '评论'}: ${speaker.title}` : displayName
  if (roleKey.startsWith('prepared-') || /prepared speaker/i.test(roleName)) {
    const title = speaker?.title ? `${en ? ' | Title: ' : '｜题目：'}${speaker.title}` : ''
    const project = speaker?.project || ''
    return `${project || displayName}${title}`
  }
  if (normalized.includes('\u6280\u672f')) return en ? 'Technical Manager' : '技术经理'
  return displayName
}

function agendaScheduleRows(rows, people, data, lang = 'zh') {
  let current = DEFAULT_AGENDA_START_MINUTES
  return rows.map((role, index) => {
    const duration = minutesFromRoleTime(role.time)
    const item = {
      id: role.id || `${role.roleName}-${index}`,
      roleName: role.roleName || '',
      time: formatAgendaTime(current),
      summary: agendaRoleSummary(role, people, data, lang),
      person: personLabel(people, role.personType, role.personId),
      duration: role.time || `${duration}`,
    }
    current += duration
    return item
  })
}

function standardAgendaScheduleRows(rows, people, data, lang = 'zh', options = {}) {
  const en = lang !== 'zh'
  const text = (zh, english) => lang === 'bi' ? `${zh} / ${english}` : (en ? english : zh)
  const byKey = new Map(rows.map(role => [canonicalAgendaRoleKey(role.roleName), role]))
  const rowFor = (key, summary, duration, personKey = key, source = null, time = '') => {
    const role = key === 'registration'
      ? (byKey.get('registration') || source || byKey.get(personKey) || {})
      : (source || byKey.get(personKey) || byKey.get(key) || {})
    const actualDuration = key === 'registration' ? (role.time || '5') : (role.time || duration)
    return {
      id: `${key}-${summary}`,
      roleName: role.roleName || key,
      time,
      summary,
      person: personLabel(people, role.personType, role.personId),
      duration: actualDuration,
    }
  }
  const preparedTimes = ['8:10PM', '8:18PM', '8:26PM']
  const preparedDurations = ['4-6', '5-7', '5-7']
  const preparedRows = ['prepared-1', 'prepared-2', 'prepared-3']
    .map(key => byKey.get(key))
    .filter(Boolean)
    .map((role, index) => rowFor(canonicalAgendaRoleKey(role.roleName), agendaRoleSummary(role, people, data, lang), preparedDurations[index] || '5-7', canonicalAgendaRoleKey(role.roleName), role, preparedTimes[index] || '8:26PM'))
  const printPreparedRows = options.compactPrint
    ? preparedRows.filter(row => canonicalAgendaRoleKey(row.roleName) !== 'prepared-3' || row.person)
    : preparedRows
  const evaluatorTimes = ['9:00PM', '9:04PM', '9:08PM']
  const evaluatorRows = ['evaluator-1', 'evaluator-2', 'evaluator-3']
    .map(key => byKey.get(key))
    .filter(Boolean)
    .map((role, index) => rowFor(canonicalAgendaRoleKey(role.roleName), agendaRoleSummary(role, people, data, lang), '2-3', canonicalAgendaRoleKey(role.roleName), role, evaluatorTimes[index] || '9:08PM'))
  const topicsRows = ['topics-1', 'topics-2', 'topics-3', 'topics-4']
    .map(key => byKey.get(key))
    .filter(Boolean)
    .map((role, index) => rowFor(canonicalAgendaRoleKey(role.roleName), agendaRoleSummary(role, people, data, lang), role.time || '2', canonicalAgendaRoleKey(role.roleName), role, '8:37PM'))
  const timerRole = byKey.get('timer')
  const toastmasterRole = byKey.get('toastmaster')
  const presidentRole = byKey.get('president')
  const technicalRole = byKey.get('technical')
  const generalEvaluatorRole = byKey.get('general-evaluator')
  const topicsEvaluatorRole = byKey.get('topics-evaluator')

  const standardFlow = [
    ...(options.omitSetupRows ? [] : [
      rowFor('technical', text('\u6280\u672f\u7ecf\u7406', 'Technical Manager'), '15', 'technical', technicalRole),
      rowFor('registration', text('\u767b\u8bb0\u4e0e\u4ea4\u6d41', 'Registration and networking'), '5', 'registration'),
    ]),
    rowFor('sergeant', text('\u793c\u5bbe\u53f8\u81f4\u6b22\u8fce\u8bcd', 'Sergeant at Arms welcome'), '3', 'sergeant'),
    rowFor('president', text('\u4f1a\u957f\u81f4\u5f00\u4f1a\u8bcd', 'President opening address'), '5', 'president', presidentRole),
    rowFor('toastmaster', text('\u53f8\u4eea\u4ecb\u7ecd\u8282\u76ee\u6d41\u7a0b', 'Introduce the meeting program'), '5', 'toastmaster', toastmasterRole),
    rowFor('timer-briefing', text('\u8ba1\u65f6\u5458\u8bf4\u660e\u65f6\u95f4\u89c4\u5219', 'Timer explains timing rules'), '3', 'timer', timerRole),
    rowFor('ah-counter-briefing', text('\u5c3e\u97f3\u8ba1\u7b97\u5458\u8bf4\u660e\u89c4\u5219', 'Ah Counter explains rules'), '3', 'ah-counter'),
    rowFor('grammarian', text('\u8bed\u8a00\u8bc4\u8bba\u5458\u4ecb\u7ecd\u6bcf\u65e5\u4e00\u8bcd', 'Grammarian introduces Word of the Day'), '5', 'grammarian'),
    { section: text('\u6f14\u8bf4\u73af\u8282', 'Prepared Speeches') },
    ...printPreparedRows,
    rowFor('timer-report-1', text('\u8ba1\u65f6\u62a5\u544a', 'Timer Report'), '3', 'timer', timerRole),
    rowFor('topics-master', text('\u5373\u5e2d\u4e3b\u6301', 'Table Topics Session'), '20', 'topics-master'),
    ...(options.compactPrint ? [] : topicsRows),
    rowFor('timer-report-2', text('\u8ba1\u65f6\u62a5\u544a', 'Timer Report'), '3', 'timer', timerRole),
    rowFor('photo', text('\u5927\u5408\u7167', 'Group Photo'), '5', 'president', presidentRole),
    rowFor('break', text('\u4ea4\u6d41\u65f6\u95f4', 'Networking Break'), '5', 'toastmaster', toastmasterRole),
    { section: text('\u8bc4\u8bba\uff08\u7531\u603b\u8bc4\u8bba\u627f\u63a5\uff09', 'Evaluation Session') },
    ...evaluatorRows,
    rowFor('topics-evaluation', text('\u5373\u5e2d\u8bc4\u8bba', 'Table Topics Evaluation'), '10', 'topics-evaluator', topicsEvaluatorRole),
    rowFor('timer-report-3', text('\u8ba1\u65f6\u62a5\u544a', 'Timer Report'), '3', 'timer', timerRole),
    rowFor('vote', text('\u6295\u7968\u73af\u8282', 'Voting Session'), '5', 'toastmaster', toastmasterRole),
    rowFor('grammarian-report', text('\u8bed\u8a00\u8bc4\u8bba', 'Grammarian Report'), '5', 'grammarian'),
    rowFor('ah-counter-report', text('\u5c3e\u97f3\u8ba1\u7b97\u62a5\u544a', 'Ah Counter Report'), '3', 'ah-counter'),
    rowFor('general-evaluator', text('\u603b\u8bc4\u8bba', 'General Evaluation'), '10', 'general-evaluator', generalEvaluatorRole),
    rowFor('awards', text('\u8868\u626c\u6700\u4f73\u8868\u73b0', 'Awards Presentation'), '5', 'toastmaster', toastmasterRole),
    rowFor('exco-report', text('\u6267\u59d4\u53ca\u4e8b\u9879\u62a5\u544a', 'EXCO / Announcements'), '5', 'toastmaster', toastmasterRole),
    rowFor('president-closing', text('\u4f1a\u957f\u81f4\u4f11\u4f1a\u8bcd', 'President closing address'), '5', 'president', presidentRole),
  ]
  let current = 19 * 60 + 15
  return standardFlow.map((item, index) => {
    if (item.section) return { id: `section-${index}`, section: item.section }
    const next = { ...item, time: formatAgendaTime(current) }
    current += minutesFromRoleTime(item.duration)
    return next
  })
}

function agendaSectionLabel(item = {}) {
  const roleName = item.roleName || ''
  if (/prepared speaker 1/i.test(roleName)) return '演说环节'
  if (/^evaluator 1/i.test(roleName)) return '评论（由总评论承接）'
  return ''
}

function meetingRecordKey() {
  return `tm-meeting-records-v1-${getActiveClubId()}`
}

function isRecordLocked(record) {
  if (!record?.savedAt) return false
  const savedTime = new Date(record.savedAt).getTime()
  if (Number.isNaN(savedTime)) return false
  return Date.now() - savedTime > 7 * 24 * 60 * 60 * 1000
}

function normalizeAgendaText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[：:|,，()（）\[\]【】]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findPersonInText(text, people) {
  const normalized = normalizeAgendaText(text)
  const rows = [
    ...people.members.map(item => ({ ...item, personType: 'member' })),
    ...people.guests.map(item => ({ ...item, personType: 'guest' })),
  ]
  return rows
    .filter(item => item.name)
    .sort((a, b) => String(b.name).length - String(a.name).length)
    .find(item => {
      const names = [item.name, item.englishName].filter(Boolean).map(normalizeAgendaText)
      return names.some(name => name && normalized.includes(name))
    })
}

function splitAgendaNames(value = '') {
  return cleanAgendaValue(value)
    .split(/\s*(?:\/|、|，|,|\+|和|及)\s*/g)
    .map(name => name.replace(/\s*(TC|DTM|LD|L)\d*$/i, '').trim())
    .filter(Boolean)
}

function roleCategory(roleName = '') {
  const key = canonicalAgendaRoleKey(roleName)
  const normalized = normalizeAgendaText(roleName)
  if (key.startsWith('prepared-') || /prepared speaker/i.test(roleName) || normalized.includes('\u5907\u7a3f\u8bb2\u5458') || normalized.includes('\u5907\u7a3f')) return 'prepared'
  if (/^topics-\d+$/.test(key) || /table topics speaker/i.test(roleName) || normalized.includes('\u5373\u5e2d\u8bb2\u5458')) return 'impromptu'
  if (key.startsWith('evaluator-') || /^evaluator\b/i.test(roleName) || normalized.includes('\u8bc4\u8bba') || normalized.includes('\u8bc4\u4f30\u5458') || normalized.includes('\u8bb2\u8bc4')) return 'evaluator'
  return ''
}

function roleAliases(roleName = '') {
  const lower = roleName.toLowerCase()
  const aliases = [roleName]
  if (lower.includes('toastmaster of the evening')) aliases.push('toastmaster', 'tme', '\u4f8b\u4f1a\u4e3b\u6301\u4eba', '\u4e3b\u6301\u4eba')
  if (lower.includes('president')) aliases.push('president', '\u4f1a\u957f', '\u4f1a\u957f\u5f00\u4f1a')
  if (lower.includes('sergeant')) aliases.push('sergeant at arms', 'saa', '\u7eaa\u5f8b\u5b98')
  if (lower.includes('timer')) aliases.push('timer', '\u8ba1\u65f6\u5458')
  if (lower.includes('ah counter')) aliases.push('ah counter', '\u54fc\u54c8\u5b98', '\u5c3e\u97f3\u8ba1\u7b97\u5458', '\u5c3e\u97f3')
  if (lower.includes('grammarian')) aliases.push('grammarian', '\u8bed\u6cd5\u5b98', '\u8bed\u8a00\u8bc4\u8bba\u5458', '\u8bed\u8a00\u8bc4\u8bba')
  if (lower.includes('general evaluator')) aliases.push('general evaluator', '\u603b\u8bc4\u4f30', '\u603b\u8bc4\u8bba', '\u603b\u8bc4')
  if (/^prepared speaker/i.test(roleName)) aliases.push('prepared speaker', '\u5907\u7a3f\u8bb2\u5458', '\u5907\u7a3f', '\u6f14\u8bb2')
  if (/^evaluator/i.test(roleName)) aliases.push('evaluator', '\u8bc4\u4f30\u5458', '\u8bb2\u8bc4', '\u8bc4\u8bba')
  if (/table topics master/i.test(roleName)) aliases.push('table topics master', '\u5373\u5e2d\u4e3b\u6301\u4eba', '\u5373\u5e2d\u4e3b\u6301')
  if (/table topics speaker/i.test(roleName)) aliases.push('table topics speaker', '\u5373\u5e2d\u8bb2\u5458')
  if (lower.includes('technical')) aliases.push('technical manager', '\u6280\u672f\u7ecf\u7406')
  if (roleName.includes('技术')) aliases.push('technical manager', '技术经理', '技术')
  if (lower.includes('toastmaster of the evening')) aliases.push('toastmaster', 'tme', '主持人')
  if (lower.includes('sergeant')) aliases.push('sergeant at arms', 'saa', '纪律官')
  if (lower.includes('timer')) aliases.push('timer', '计时员')
  if (lower.includes('ah counter')) aliases.push('ah counter', '哼哈官')
  if (lower.includes('grammarian')) aliases.push('grammarian', '语法官')
  if (lower.includes('general evaluator')) aliases.push('general evaluator', '总评估')
  if (/^prepared speaker/i.test(roleName)) aliases.push('prepared speaker', '备稿讲员', '演讲')
  if (/^evaluator/i.test(roleName)) aliases.push('evaluator', '评估员', '讲评')
  if (/table topics master/i.test(roleName)) aliases.push('table topics master', '即席主持')
  if (/table topics speaker/i.test(roleName)) aliases.push('table topics speaker', '即席讲员')
  return aliases.map(normalizeAgendaText).filter(Boolean)
}

function lineLooksLikeRole(line, roles) {
  const normalized = normalizeAgendaText(line)
  return roles.some(role => roleAliases(role.roleName).some(alias => alias && normalized.includes(alias)))
}

function cleanAgendaValue(value = '') {
  return String(value || '')
    .replace(/[❣️📅🕚🌍✅🆓]/g, '')
    .replace(/^[\s:：,，]+|[\s:：,，]+$/g, '')
    .trim()
}

function personFromAgendaValue(value = '', people) {
  const cleaned = cleanAgendaValue(value)
    .replace(/[,ï¼Œ].*$/, '')
    .replace(/\s*(TC|DTM|LD|L)\d*$/i, '')
    .trim()
  if (!cleaned) return null
  const direct = findPersonInText(cleaned, people) || findExistingPersonByName(cleaned, people)
  if (direct) return direct
  for (const name of splitAgendaNames(value)) {
    const person = findPersonInText(name, people) || findExistingPersonByName(name, people)
    if (person) return person
  }
  return null
}

function extractAgendaValue(lines, patterns) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match?.[1]) return cleanAgendaValue(match[1])
    }
  }
  return ''
}

function formatImportedDate(value = '') {
  const chineseDate = value.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (chineseDate) {
    const [, year, month, day] = chineseDate
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  const slashDate = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (slashDate) {
    const [, day, month, year] = slashDate
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return value
}

function parseAgendaMeetingDetails(text, currentMeeting = {}) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const meetingNumber = extractAgendaValue(lines, [/第\s*(\d+)\s*次\s*例会/, /第\s*(\d+)\s*次/])
  const date = extractAgendaValue(lines, [/日期\s*[：:]\s*(.+)$/])
  const closeTime = extractAgendaValue(lines, [/时间\s*[：:]\s*(.+)$/])
  return {
    ...currentMeeting,
    number: meetingNumber ? `第${meetingNumber}次` : currentMeeting.number,
    date: date ? formatImportedDate(date) : currentMeeting.date,
    theme: extractAgendaValue(lines, [/例会主题\s*[：:]\s*(.+)$/]) || currentMeeting.theme,
    word: extractAgendaValue(lines, [/每日一词\s*[：:]\s*(.+)$/]) || currentMeeting.word,
    closeTime: closeTime || currentMeeting.closeTime,
  }
}

function parseAgendaSpeakerDetails(text) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const prepared = []
  lines.forEach((line, index) => {
    const speakerMatch = line.match(/备稿\s*(\d+)\s*[：:]\s*(.+)$/)
    if (!speakerMatch) return
    const [, number, rawName] = speakerMatch
    const nextLines = lines.slice(index + 1, index + 5)
    const title = extractAgendaValue(nextLines, [/题目\s*[：:]\s*(.+)$/])
    const project = extractAgendaValue(nextLines, [/等级\s*作业\s*[：:]\s*(.+)$/])
    prepared.push({
      index: Number(number),
      name: cleanAgendaValue(rawName),
      title,
      project,
    })
  })
  return prepared
}

function findExistingPersonByName(name, people) {
  const normalized = normalizeAgendaText(name)
  const rows = [
    ...people.members.map(item => ({ ...item, personType: 'member' })),
    ...people.guests.map(item => ({ ...item, personType: 'guest' })),
  ]
  return rows.find(item => [item.name, item.englishName].filter(Boolean).some(entry => normalizeAgendaText(entry) === normalized))
}

function ensureAgendaPeople(text, people) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const namePatterns = [
    /技术经理\s*[：:]\s*(.+)$/,
    /即席评论员\s*[：:]\s*(.+)$/,
    /会长致开\/休会词\s*[：:]\s*([^,，]+)/,
    /登记\/交流\/礼宾司\s*[：:]\s*(.+)$/,
    /司仪\s*[：:]\s*(.+)$/,
    /备稿\s*\d+\s*[：:]\s*(.+)$/,
    /评论\s*\d+\s*[：:]\s*(.+)$/,
    /即席主持人\s*[：:]\s*(.+)$/,
    /即席评论员\s*[：:]\s*(.+)$/,
    /语言评论员\s*[：:]\s*(.+)$/,
    /尾音计算员\s*[：:]\s*(.+)$/,
    /计时员\s*[：:]\s*(.+)$/,
    /技术经理\s*[：:]\s*(.+)$/,
    /技术经理\s*(?:是|为)?\s*[：:]?\s*(.+)$/,
    /总评论\s*[：:]\s*(.+)$/,
  ]
  const names = lines.flatMap(line => namePatterns.map(pattern => line.match(pattern)?.[1]).filter(Boolean))
    .map(name => cleanAgendaValue(name).replace(/[,，].*$/, '').replace(/\s*(TC|DTM|LD|L)\d*$/i, '').trim())
    .filter(Boolean)
  const nextGuests = [...people.guests]
  names.flatMap(name => splitAgendaNames(name)).forEach(name => {
    if (findExistingPersonByName(name, { ...people, guests: nextGuests })) return
    nextGuests.push({
      id: `g${Date.now()}${nextGuests.length}`,
      name,
      email: '',
      phone: '',
      introducer: '',
      visitDate: '',
      status: 'guest',
    })
  })
  return { ...people, guests: nextGuests }
}

function importAgendaTextToRoles(text, roles, people) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  if (!lines.length) return roles

  const directAssignments = [
    { key: 'technical', patterns: [/技术经理\s*[：:]\s*(.+)$/, /技术经理\s*(?:是|为)?\s*[：:]?\s*(.+)$/] },
    { key: 'topics-evaluator', patterns: [/即席评论员\s*[：:]\s*(.+)$/, /即席评论\s*[：:]\s*(.+)$/] },
    { key: 'president', patterns: [/会长致开\/休会词\s*[：:]\s*([^,，]+)/] },
    { key: 'sergeant', patterns: [/登记\/交流\/礼宾司\s*[：:]\s*(.+)$/] },
    { key: 'toastmaster', patterns: [/司仪\s*[：:]\s*(.+)$/] },
    { key: 'prepared-1', patterns: [/备稿\s*1\s*[：:]\s*(.+)$/] },
    { key: 'prepared-2', patterns: [/备稿\s*2\s*[：:]\s*(.+)$/] },
    { key: 'prepared-3', patterns: [/备稿\s*3\s*[：:]\s*(.+)$/] },
    { key: 'evaluator-1', patterns: [/评论\s*1\s*[：:]\s*(.+)$/] },
    { key: 'evaluator-2', patterns: [/评论\s*2\s*[：:]\s*(.+)$/] },
    { key: 'evaluator-3', patterns: [/评论\s*3\s*[：:]\s*(.+)$/] },
    { key: 'topics-master', patterns: [/即席主持人\s*[：:]\s*(.+)$/] },
    { key: 'grammarian', patterns: [/语言评论员\s*[：:]\s*(.+)$/] },
    { key: 'ah-counter', patterns: [/尾音计算员\s*[：:]\s*(.+)$/] },
    { key: 'timer', patterns: [/计时员\s*[：:]\s*(.+)$/] },
    { key: 'technical', patterns: [/技术经理\s*[：:]\s*(.+)$/, /技术经理\s*(?:是|为)?\s*[：:]?\s*(.+)$/] },
    { key: 'general-evaluator', patterns: [/总评论\s*[：:]\s*(.+)$/] },
  ]
  const personForKey = new Map()
  directAssignments.forEach(item => {
    const value = extractAgendaValue(lines, item.patterns)
    if (!value) return
    const person = personFromAgendaValue(value, people)
    if (person) personForKey.set(item.key, person)
  })
  const existingKeys = new Set(roles.map(role => canonicalAgendaRoleKey(role.roleName)))
  let nextRoles = [...roles]
  if (personForKey.has('technical') && !existingKeys.has('technical')) {
    nextRoles = [
      ...nextRoles,
      { id: `r${Date.now()}technical`, roleName: '技术经理', time: '', personType: 'member', personId: '' },
    ]
  }

  if (personForKey.has('topics-evaluator') && !existingKeys.has('topics-evaluator')) {
    nextRoles = [
      ...nextRoles,
      { id: `r${Date.now()}topicsEvaluator`, roleName: '即席评论员', time: '5', personType: 'member', personId: '' },
    ]
  }

  const usedLineIndexes = new Set()
  return nextRoles.map(role => {
    const directPerson = personForKey.get(canonicalAgendaRoleKey(role.roleName))
    if (directPerson) return { ...role, personType: directPerson.personType, personId: directPerson.id }
    const aliases = roleAliases(role.roleName)
    let matchedLineIndex = lines.findIndex((line, index) => {
      if (usedLineIndexes.has(index)) return false
      const normalized = normalizeAgendaText(line)
      return normalizeAgendaText(role.roleName) && normalized.includes(normalizeAgendaText(role.roleName))
    })
    if (matchedLineIndex < 0) matchedLineIndex = lines.findIndex((line, index) => {
      if (usedLineIndexes.has(index)) return false
      const normalized = normalizeAgendaText(line)
      return aliases.some(alias => normalized.includes(alias)) && findPersonInText(line, people)
    })
    const nextLine = lines[matchedLineIndex + 1] || ''
    const searchText = matchedLineIndex >= 0
      ? [lines[matchedLineIndex], nextLine && !lineLooksLikeRole(nextLine, roles) ? nextLine : ''].join(' ')
      : lines.join(' ')
    const person = matchedLineIndex >= 0 ? findPersonInText(searchText, people) : null
    if (person) usedLineIndexes.add(matchedLineIndex)
    return person ? { ...role, personType: person.personType, personId: person.id } : role
  })
}

function MeetingView({ data, setData, persistState, people, setPeople, persistPeople, meetingOps, setMeetingOps, persistMeetingOps, syncStatus, t, settings, voteLink }) {
  const uiLang = t.langLabel === 'Language' ? 'en' : 'zh'
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(meetingRecordKey()) || '[]')
    } catch {
      return []
    }
  })
  const [selectedRecordId, setSelectedRecordId] = useState('current')
  const [meetingActionStatus, setMeetingActionStatus] = useState('')
  const [agendaImportOpen, setAgendaImportOpen] = useState(false)
  const [agendaImportText, setAgendaImportText] = useState('')
  const selectedRecord = records.find(record => record.id === selectedRecordId)
  const viewingOldRecord = selectedRecordId !== 'current'
  const locked = viewingOldRecord || isRecordLocked(selectedRecord)
  const memberAttendance = meetingOps.attendance.filter(item => item.personType === 'member')
  const attendanceIndex = new Map(memberAttendance.map(item => [`${item.personType}:${item.personId}`, item.attended]))
  const attendanceRows = people.members
    .filter(item => item.status !== 'inactive')
    .map(item => ({ personType: 'member', personId: item.id, name: item.name }))
    .filter(item => item.name)

  useEffect(() => {
    let ignore = false
    async function hydrateRecords() {
      try {
        const cloudRecords = await loadMeetingRecordsState()
        if (!ignore && cloudRecords.data.length) {
          const localRecords = JSON.parse(localStorage.getItem(meetingRecordKey()) || '[]')
          const merged = [
            ...cloudRecords.data,
            ...localRecords.filter(local => !cloudRecords.data.some(cloud => cloud.id === local.id)),
          ]
          setRecords(merged)
          localStorage.setItem(meetingRecordKey(), JSON.stringify(merged))
        }
      } catch {
        // Local records are already loaded; cloud history is an enhancement.
      }
    }
    hydrateRecords()
    return () => { ignore = true }
  }, [data?.meeting?.id])

  function updateMeeting(field, value) {
    if (locked) return
    setData({ ...data, meeting: { ...data.meeting, [field]: value } })
  }

  function updateAttendance(personType, personId, attended) {
    if (locked) return
    const key = `${personType}:${personId}`
    const existing = meetingOps.attendance.find(item => `${item.personType}:${item.personId}` === key)
    const nextAttendance = existing
      ? meetingOps.attendance.map(item => `${item.personType}:${item.personId}` === key ? { ...item, attended } : item)
      : [...meetingOps.attendance, { personType, personId, attended }]
    setMeetingOps({ ...meetingOps, attendance: nextAttendance })
  }

  function updateRole(id, field, value) {
    if (locked) return
    setMeetingOps({
      ...meetingOps,
      roles: meetingOps.roles.map(item => item.id === id ? { ...item, [field]: value } : item),
    })
  }

  function updateRolePerson(id, personType, personId) {
    if (locked) return
    setMeetingOps({
      ...meetingOps,
      roles: meetingOps.roles.map(item => item.id === id ? { ...item, personType, personId } : item),
    })
  }

  function addRole() {
    if (locked) return
    setMeetingOps({
      ...meetingOps,
      roles: [...meetingOps.roles, { id: `r${Date.now()}`, roleName: '', time: '', personType: 'member', personId: '' }],
    })
  }

  function removeRole(id) {
    if (locked) return
    setMeetingOps({ ...meetingOps, roles: meetingOps.roles.filter(item => item.id !== id) })
  }

  async function resetRolesFromTemplate() {
    if (locked) return
    setMeetingActionStatus(t.syncing)
    const roles = fullToastmastersRoles(settings, uiLang)
    const syncedData = candidatesFromMeetingRoles(roles, people, data)
    setMeetingOps({ ...meetingOps, roles })
    setData(syncedData)
    try {
      const savedData = await persistState(syncedData) || syncedData
      setData(savedData)
      await persistMeetingOps({ ...meetingOps, roles }, savedData.meeting?.id)
      setMeetingActionStatus(t.meetingSaved)
    } catch (err) {
      setMeetingActionStatus(err.message || t.saveFailed)
    }
  }

  async function createMeeting() {
    setSelectedRecordId('current')
    const roles = fullToastmastersRoles(settings, uiLang)
    const currentNumber = String(data.meeting.number || '').match(/\d+/)?.[0]
    const nextNumber = currentNumber ? `第${Number(currentNumber) + 1}次` : ''
    const next = {
      ...data,
      meeting: {
        ...data.meeting,
        id: `${Date.now()}`,
        number: nextNumber,
        date: new Date().toISOString().slice(0, 10),
        theme: '',
        word: '',
        closeTime: '',
        status: 'draft',
      },
      prepared: [],
      impromptu: [],
      evaluator: [],
    }
    setData(next)
    setMeetingOps({
      attendance: [],
      roles,
    })
    setMeetingActionStatus(t.syncing)
    try {
      const savedData = await persistState(next) || next
      setData(savedData)
      await persistMeetingOps({ attendance: [], roles }, savedData.meeting?.id)
      setMeetingActionStatus(t.meetingSaved)
    } catch (err) {
      setMeetingActionStatus(err.message || t.saveFailed)
    }
  }

  async function applyAgendaImport() {
    if (locked) return
    const importedPeople = ensureAgendaPeople(agendaImportText, people)
    const importedMeeting = parseAgendaMeetingDetails(agendaImportText, data.meeting)
    const preparedDetails = parseAgendaSpeakerDetails(agendaImportText)
    const importedRoles = importAgendaTextToRoles(agendaImportText, meetingOps.roles, importedPeople)
    const detailedRoles = importedRoles.map(role => {
      if (roleCategory(role.roleName) !== 'prepared') return role
      const roleKey = canonicalAgendaRoleKey(role.roleName)
      const roleIndex = Number(String(roleKey).replace('prepared-', ''))
      const rolePerson = personLabel(importedPeople, role.personType, role.personId)
      const details = preparedDetails.find(entry => entry.index === roleIndex || normalizeAgendaText(entry.name) === normalizeAgendaText(rolePerson))
      return details
        ? { ...role, title: details.title || role.title || '', project: details.project || role.project || '' }
        : role
    })
    const syncedData = candidatesFromMeetingRoles(detailedRoles, importedPeople, { ...data, meeting: importedMeeting })
    const detailedData = {
      ...syncedData,
      prepared: syncedData.prepared.map((item, index) => {
        const details = preparedDetails.find(entry => entry.index === index + 1 || normalizeAgendaText(entry.name) === normalizeAgendaText(item.name))
        return details
          ? { ...item, title: details.title || item.title, project: details.project || item.project }
          : item
      }),
    }
    setPeople(importedPeople)
    setMeetingOps({ ...meetingOps, roles: detailedRoles })
    setData(detailedData)
    setAgendaImportOpen(false)
    setAgendaImportText('')
    setMeetingActionStatus(t.syncing)
    try {
      await persistPeople(importedPeople)
      const savedData = await persistState(detailedData) || detailedData
      setData(savedData)
      await persistMeetingOps({ ...meetingOps, roles: detailedRoles }, savedData.meeting?.id)
      setMeetingActionStatus(t.importApplied)
    } catch (err) {
      setMeetingActionStatus(err.message || t.saveFailed)
    }
  }

  function exportExcel() {
    const exportLang = settings.agendaLanguage === 'auto' || !settings.agendaLanguage ? uiLang : settings.agendaLanguage
    const en = exportLang === 'en'
    const bi = exportLang === 'bi'
    const label = (zh, english) => bi ? `${zh} / ${english}` : (en ? english : zh)
    const exportRows = standardAgendaScheduleRows(agendaRowsFromTemplate(settings, meetingOps.roles), people, data, exportLang, { omitSetupRows: true })
    const infoRows = [
      [label('分会名称', 'Club Name'), settings.clubName || t.club],
      ['Toastmaster ID', settings.toastmasterId || ''],
      [label('会议编号', 'Meeting No.'), data.meeting.number || ''],
      [label('日期', 'Date'), data.meeting.date || ''],
      [label('主题', 'Theme'), data.meeting.theme || ''],
      [label('每日一词', 'Word of the Day'), data.meeting.word || ''],
      [label('截止时间', 'Close Time'), data.meeting.closeTime || ''],
    ]
    const tableRow = cells => `<tr>${cells.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
    const agendaTableRows = exportRows.map(item => item.section
      ? `<tr><td colspan="5" class="section">${escapeHtml(item.section)}</td></tr>`
      : tableRow([item.time, item.summary, item.person || '', item.duration, '']))
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Microsoft JhengHei", Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #2d4f72; padding: 6px; font-size: 12pt; }
    th { background: #9bb7d7; font-weight: 800; }
    .title { background: #0f5d99; color: #fff; font-size: 20pt; font-weight: 900; text-align: center; }
    .section { background: #dbe6f3; font-weight: 900; }
  </style>
</head>
<body>
  <table>
    <tr><td colspan="5" class="title">${escapeHtml(`${data.meeting.number || ''} ${label('例常活动议程表', 'Regular Meeting Agenda')}`)}</td></tr>
    ${infoRows.map(row => `<tr><th>${escapeHtml(row[0])}</th><td colspan="4">${escapeHtml(row[1])}</td></tr>`).join('')}
    <tr><th>${escapeHtml(label('时间', 'Time'))}</th><th>${escapeHtml(label('摘要 / 题目', 'Agenda / Topic'))}</th><th>${escapeHtml(label('负责人', 'Person In Charge'))}</th><th>${escapeHtml(label('时限', 'Time Limit'))}</th><th>${escapeHtml(label('备注', 'Remark'))}</th></tr>
    ${agendaTableRows.join('')}
    <tr><td colspan="5"></td></tr>
    <tr><th colspan="5">${escapeHtml(label('备稿讲员资料', 'Prepared Speaker Details'))}</th></tr>
    <tr><th>${escapeHtml(label('备稿讲员', 'Prepared Speaker'))}</th><th colspan="2">${escapeHtml(label('题目', 'Title'))}</th><th colspan="2">${escapeHtml(label('项目', 'Project'))}</th></tr>
    ${(data.prepared || []).map(item => `<tr><td>${escapeHtml(item.name)}</td><td colspan="2">${escapeHtml(item.title || '')}</td><td colspan="2">${escapeHtml(item.project || '')}</td></tr>`).join('')}
  </table>
</body>
</html>`
    const blob = new Blob([`\uFEFF${html}`], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.meeting.number || 'meeting'}-agenda.xls`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function saveMeetingAll() {
    if (locked) return
    setMeetingActionStatus(t.syncing)
    const syncedData = candidatesFromMeetingRoles(meetingOps.roles, people, data)
    try {
      const savedData = await persistState(syncedData) || syncedData
      const activeMeetingId = savedData.meeting?.id || syncedData.meeting.id
      const sanitizedMeetingOps = {
        ...meetingOps,
        attendance: meetingOps.attendance.filter(item => item.personType === 'member'),
      }
      setData(savedData)
      setMeetingOps(sanitizedMeetingOps)
      await persistMeetingOps(sanitizedMeetingOps, activeMeetingId)
      const record = {
        id: activeMeetingId || `${Date.now()}`,
        savedAt: new Date().toISOString(),
        data: savedData,
        meetingOps: sanitizedMeetingOps,
      }
      const nextRecords = [
        record,
        ...records.filter(item => item.id !== record.id),
      ]
      setRecords(nextRecords)
      localStorage.setItem(meetingRecordKey(), JSON.stringify(nextRecords))
      setSelectedRecordId('current')
      setMeetingActionStatus(t.meetingSaved)
    } catch (err) {
      setMeetingActionStatus(err.message || t.saveFailed)
    }
  }

  const agendaPrintRows = agendaRowsFromTemplate(settings, meetingOps.roles)
  const agendaLang = settings.agendaLanguage === 'auto' || !settings.agendaLanguage ? uiLang : settings.agendaLanguage
  const agendaSchedule = standardAgendaScheduleRows(agendaPrintRows, people, data, agendaLang, { compactPrint: true, omitSetupRows: true })
  const agendaText = agendaLang === 'bi'
    ? {
        motto: '中爱吾会， 化雨春风， 齐展翅 / Where Leaders Are Made',
        registration: '国际讲演会注册编号 / Toastmasters International Registration No.',
        area: '（102区域 M3分区 / District 102, Division M3）',
        rightMark: '中华校友会 / Toastmasters Club',
        purposeTitle: '宗旨 / Purpose: ',
        purpose1: '1. 提供会友一个互相交流与切磋的机会。 / Provide members a supportive environment to communicate, learn, and grow together.',
        purpose2: '2. 让会友逐步掌握演讲技巧，学习领导技能，提升自信与修养。 / Help members improve public speaking and leadership skills with confidence and mutual respect.',
        agendaTitle: `${data.meeting.number || t.currentMeeting}例常活动议程表 / ${data.meeting.number || t.currentMeeting} Regular Meeting Agenda`,
        topic: '主题 / Theme',
        word: '每日一词 / Word of the Day',
        qrNote: <>请扫这里签到和投选最佳讲员<br />Scan here to check in and vote</>,
        time: '时间 / Time',
        summary: '摘要 / Agenda',
        person: '负责人 / Person',
        duration: '时限 / Time Limit',
        remark: '备注 / Remark',
        goodNight: '晚安！ / Good night!',
        footerTitle: '例常活动议程表 / Regular Meeting Agenda',
      }
    : agendaLang === 'en'
    ? {
        motto: 'Where Leaders Are Made',
        registration: 'Toastmasters International Registration No.',
        area: '(District 102, Division M3)',
        rightMark: 'Toastmasters Club',
        purposeTitle: 'Purpose:',
        purpose1: '1. Provide members a supportive environment to communicate, learn, and grow together.',
        purpose2: '2. Help members improve public speaking and leadership skills with confidence and mutual respect.',
        agendaTitle: `${data.meeting.number || t.currentMeeting} Regular Meeting Agenda`,
        topic: 'Theme',
        word: 'Word of the Day',
        qrNote: <>Scan here to check in<br />and vote for best speakers</>,
        time: 'Time',
        summary: 'Agenda / Topic',
        person: 'Person In Charge',
        duration: 'Time Limit',
        remark: 'Remark',
        goodNight: 'Good night!',
        footerTitle: 'Regular Meeting Agenda',
      }
    : {
        motto: '中爱吾会， 化雨春风， 齐展翅',
        registration: '国际讲演会注册编号',
        area: '（102区域 M3分区）',
        rightMark: '中华校友会',
        purposeTitle: '宗旨：',
        purpose1: '1. 提供会友一个互相交流与切磋的机会。',
        purpose2: '2. 让会友在友好与和谐的气氛中逐步掌握演讲技巧，学习领导技能，从而培养自信心提升个人修养。',
        agendaTitle: `${data.meeting.number || t.currentMeeting}例常活动议程表`,
        topic: '主题',
        word: '每日一词',
        qrNote: <>请扫这里签到和<br />投选最佳讲员</>,
        time: '时间',
        summary: '摘要',
        person: '负责人',
        duration: '时限',
        remark: '备注',
        goodNight: '晚安！',
        footerTitle: '例常活动议程表',
      }

  function printAgenda() {
    setMeetingActionStatus(t.printAgenda)
    const agenda = document.querySelector('.tm-agenda-print')
    if (!agenda) {
      requestAnimationFrame(() => window.print())
      return
    }
    const styleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n')
    const printWindow = window.open('', '_blank', 'width=900,height=1200')
    if (!printWindow) {
      requestAnimationFrame(() => window.print())
      return
    }
    printWindow.document.open()
    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${data.meeting.number || t.printAgenda}</title>
          ${styleSheets}
          <style>
            body { margin: 0; background: white; }
            .tm-agenda-print { display: block; border: 0; box-shadow: none; border-radius: 0; }
            @media screen { body { padding: 18px; } .tm-agenda-print { width: 210mm; min-height: 297mm; margin: 0 auto; } }
            @media print { body * { visibility: visible !important; } }
          </style>
        </head>
        <body>${agenda.outerHTML}</body>
      </html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 900)
  }

  async function downloadAgendaPdf() {
    const agenda = document.querySelector('.tm-agenda-print')
    if (!agenda) return
    setMeetingActionStatus(t.generatingPdf)
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-10000px'
    wrapper.style.top = '0'
    wrapper.style.width = '210mm'
    wrapper.style.background = '#ffffff'
    wrapper.style.zIndex = '-1'
    const clone = agenda.cloneNode(true)
    clone.style.display = 'block'
    clone.style.width = '210mm'
    clone.style.minHeight = '297mm'
    clone.style.boxShadow = 'none'
    clone.style.borderRadius = '0'
    wrapper.appendChild(clone)
    clone.classList.add('pdf-export')
    document.body.appendChild(wrapper)
    try {
      await document.fonts?.ready
      await Promise.all(Array.from(clone.querySelectorAll('img')).map(img => (
        img.complete ? Promise.resolve() : new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
        })
      )))
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
      const imageWidth = canvas.width * ratio
      const imageHeight = canvas.height * ratio
      const x = (pageWidth - imageWidth) / 2
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', x, 0, imageWidth, imageHeight)
      const filename = `${data.meeting.number || 'meeting'}-${data.meeting.date || 'agenda'}.pdf`.replace(/[\\/:*?"<>|]+/g, '-')
      pdf.save(filename)
      setMeetingActionStatus(t.saved)
    } catch (err) {
      console.error(err)
      setMeetingActionStatus(t.saveFailed)
    } finally {
      wrapper.remove()
    }
  }

  function selectRecord(id) {
    setSelectedRecordId(id)
    if (id === 'current') return
    const record = records.find(item => item.id === id)
    if (!record) return
    setData(record.data)
    setMeetingOps(record.meetingOps)
  }

  function editCurrent() {
    setSelectedRecordId('current')
  }

  return (
    <div className="tm-main-column">
      <div className="tm-screen-head no-print">
        <div>
          <h1>{t.navMeeting}</h1>
          <p>{data.meeting.number || t.currentMeeting} {t.regularMeeting} | {data.meeting.date}</p>
          <p className="tm-lock-note">{locked ? t.lockedMeeting : t.editableMeeting} · {t.recordLockedNote}</p>
          {syncStatus && <div className="tm-sync-badge"><b>{syncStatus}</b></div>}
          {meetingActionStatus && <div className="tm-sync-badge"><b>{meetingActionStatus}</b></div>}
        </div>
        <div className="tm-actions">
          <button className="tm-gold" onClick={createMeeting}>{t.newMeeting}</button>
          <button onClick={editCurrent}>{t.editMeeting}</button>
          <button onClick={() => setAgendaImportOpen(true)} disabled={locked}>{t.importAgenda}</button>
          <button onClick={exportExcel}>{t.exportExcel}</button>
          <button className="tm-gold" onClick={downloadAgendaPdf}>{t.downloadPdf}</button>
          <button onClick={saveMeetingAll} disabled={locked}>{t.save}</button>
          <button onClick={addRole} disabled={locked}>{t.addRole}</button>
          <button onClick={resetRolesFromTemplate} disabled={locked}>{t.resetRoles}</button>
          <button onClick={printAgenda}>{t.printAgenda}</button>
        </div>
      </div>

      {agendaImportOpen && (
        <div className="tm-modal-backdrop no-print">
          <div className="tm-modal">
            <h2>{t.pasteAgenda}</h2>
            <p>{t.pasteAgendaHint}</p>
            <textarea
              value={agendaImportText}
              onChange={event => setAgendaImportText(event.target.value)}
              rows={12}
              placeholder={`Toastmaster of the Evening: Kenny\nTimer: Jenny\nPrepared Speaker 1: 徐子淳`}
            />
            <div className="tm-modal-actions">
              <button className="tm-gold" onClick={applyAgendaImport} disabled={!agendaImportText.trim()}>{t.applyImport}</button>
              <button onClick={() => setAgendaImportOpen(false)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <section className="tm-panel no-print">
        <div className="tm-panel-title">
          <span className="tm-icon">☷</span>
          <h2>{t.meetingRecords}</h2>
        </div>
        <div className="tm-record-toolbar">
          <label>
            <span>{t.selectRecord}</span>
            <select value={selectedRecordId} onChange={event => selectRecord(event.target.value)}>
              <option value="current">{t.currentMeeting}</option>
              {records.map(record => (
                <option key={record.id} value={record.id}>
                  {record.data?.meeting?.number || record.id} | {record.data?.meeting?.date || ''} {isRecordLocked(record) ? `(${t.lockedMeeting})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="tm-panel no-print">
        <div className="tm-panel-title">
          <span className="tm-icon">☰</span>
          <h2>{t.meetingInfo}</h2>
        </div>
        <div className="tm-form-grid">
          {[
            ['number', t.meetingNo],
            ['date', t.date],
            ['theme', t.theme],
            ['word', t.word],
            ['closeTime', t.closeTime],
          ].map(([field, label]) => (
            <label key={field}>
              <span>{label}</span>
              <input disabled={locked} value={data.meeting[field] || ''} onChange={event => updateMeeting(field, event.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <section className="tm-panel no-print">
        <div className="tm-panel-title">
          <span className="tm-icon">✓</span>
          <h2>{t.attendanceTitle}</h2>
        </div>
        <div className="tm-attendance-grid">
          {attendanceRows.map(item => {
            const checked = attendanceIndex.get(`${item.personType}:${item.personId}`) !== false
            return (
              <label key={`${item.personType}-${item.personId}`} className="tm-attendance-item">
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={checked}
                  onChange={event => updateAttendance(item.personType, item.personId, event.target.checked)}
                />
                <span>{item.name}</span>
                <small>{item.personType === 'guest' ? t.guest : t.member}</small>
              </label>
            )
          })}
        </div>
      </section>

      <section className="tm-panel no-print">
        <div className="tm-panel-title">
          <span className="tm-icon">▦</span>
          <h2>{t.rolesTitle}</h2>
        </div>
        <div className="tm-role-table">
          <div className="tm-role-head">
            <span>{t.role}</span>
            <span>{t.roleTime}</span>
            <span>{t.speechTitle} / {t.project}</span>
            <span>{t.assignee}</span>
            <span>{t.action}</span>
          </div>
          {meetingOps.roles.map(item => (
            <div className="tm-role-row" key={item.id}>
              <input disabled={locked} value={localizedRoleName(item.roleName, uiLang)} onChange={event => updateRole(item.id, 'roleName', event.target.value)} />
              <input disabled={locked} value={item.time || ''} onChange={event => updateRole(item.id, 'time', event.target.value)} />
              <div className="tm-role-details">
                {roleCategory(item.roleName) === 'prepared' ? (
                  <>
                    <input disabled={locked} value={item.title || ''} placeholder={t.speechTitle} onChange={event => updateRole(item.id, 'title', event.target.value)} />
                    <input disabled={locked} value={item.project || ''} placeholder={t.project} onChange={event => updateRole(item.id, 'project', event.target.value)} />
                  </>
                ) : (
                  <span className="tm-role-empty">-</span>
                )}
              </div>
              <PersonSelect
                people={people}
                personType={item.personType}
                personId={item.personId}
                onChange={(personType, personId) => !locked && updateRolePerson(item.id, personType, personId)}
                t={t}
                disabled={locked}
              />
              <button className="tm-danger" disabled={locked} onClick={() => removeRole(item.id)}>{t.remove}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="tm-agenda-print">
        <div className="tm-agenda-content">
          <div className="tm-agenda-motto">{agendaText.motto}</div>
          <div className="tm-agenda-frame">
            <header className="tm-agenda-template-head">
              <div className="tm-agenda-logo-box">
                {settings.logoDataUrl && <img className="tm-agenda-logo" src={settings.logoDataUrl} alt={t.clubShort} />}
              </div>
              <div>
                <h1>{t.club}</h1>
                <h3>CHUNG HWA ALUMNI ASSOCIATION MANDARIN TOASTMASTERS CLUB</h3>
                <p>{agendaText.registration}: {settings.toastmasterId || 'CB-00003015'} {agendaText.area}</p>
              </div>
              <div className="tm-agenda-logo-box right-mark">
                <span>{agendaText.rightMark}</span>
              </div>
            </header>
            <div className="tm-agenda-title-bar">
              <strong>{agendaText.agendaTitle}</strong>
              <span>{data.meeting.date || t.pending}</span>
            </div>
            <div className="tm-agenda-topic-row">
              <div>
                <p>{agendaText.topic}: {data.meeting.theme || t.pending}</p>
                <p>{agendaText.word}: {data.meeting.word || t.pending}</p>
              </div>
              <div className="tm-agenda-qr-note">{agendaText.qrNote}</div>
              <div className="tm-agenda-qr">
                <QrBlock value={voteLink} compact />
              </div>
            </div>
            <table className="tm-agenda-table">
              <colgroup>
                <col style={{ width: '11.5%' }} />
                <col style={{ width: '42%' }} />
                <col style={{ width: '20.5%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{agendaText.time}</th>
                  <th>{agendaText.summary}</th>
                  <th>{agendaText.person}</th>
                  <th>{agendaText.duration}</th>
                  <th>{agendaText.remark}</th>
                </tr>
              </thead>
              <tbody>
                {agendaSchedule.map((item, index) => (
                  <Fragment key={item.id}>
                    {item.section ? (
                      <tr className="section"><td colSpan="5">{item.section}</td></tr>
                    ) : (
                      <tr>
                        <td className="time">{item.time}</td>
                        <td>{item.summary}</td>
                        <td className="person">{item.person || t.pending}</td>
                        <td className="duration">{item.duration}</td>
                        <td></td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tm-agenda-footer">{t.club} - {data.meeting.number || t.currentMeeting} {agendaText.footerTitle}</div>
          <div className="tm-agenda-mini-summary">
            <div><b>{t.preparedSpeakers}</b>{data.prepared.map(item => <span key={item.id}>{item.name || t.pending}{item.title ? `｜${item.title}` : ''}</span>)}</div>
            <div><b>{t.tableTopics}</b>{data.impromptu.map(item => <span key={item.id}>{item.name || t.pending}</span>)}</div>
            <div><b>{t.evaluators}</b>{data.evaluator.map(item => <span key={item.id}>{item.name || t.pending}</span>)}</div>
          </div>
          {false && (
            <>
              {settings.logoDataUrl && <img className="tm-agenda-logo" src={settings.logoDataUrl} alt={t.clubShort} />}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function normalizeState(next) {
  return {
    ...next,
    evaluator: next.evaluator || [
      { id: 'e1', name: '胡惠钦', votes: 0 },
      { id: 'e2', name: '叶雪娥', votes: 0 },
    ],
    history: (next.history || []).map(record => ({
      ...record,
      evaluatorWinner: record.evaluatorWinner || '',
      evaluatorVotes: record.evaluatorVotes || 0,
    })),
  }
}

function LoginView({ lang, setLang, t, onLogin }) {
  const loginClubs = useMemo(() => {
    const savedClubs = loadManagedClubs()
    if (savedClubs.length) return savedClubs
    return [{ id: 'default', clubName: t.defaultClub, toastmasterId: 'default' }]
  }, [t.defaultClub])
  const [selectedClubId, setSelectedClubId] = useState(() => getActiveClubId() || loginClubs[0]?.id || 'default')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(mode) {
    if (!email.includes('@')) {
      setError(t.loginEmailHint)
      return
    }
    setBusy(true)
    setError('')
    try {
      const selectedClub = loginClubs.find(club => club.id === selectedClubId) || loginClubs[0]
      localStorage.setItem('tm-login-toastmaster-id', selectedClub?.toastmasterId || selectedClubId)
      setActiveClubId(selectedClub?.id || selectedClubId || 'default')
      const user = mode === 'signup'
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)
      onLogin(user)
    } catch (err) {
      setError(err.message || t.saveFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tm-login-page">
      <div className="tm-login-card">
        <div className="tm-brand tm-login-brand">Toastmasters</div>
        <LanguageToggle lang={lang} setLang={setLang} t={t} />
        <h1>{t.loginTitle}</h1>
        <p>{t.loginSubtitle}</p>
        <p className="tm-login-note">{t.privateSpace}</p>
        <label>
          <span>{t.toastmasterLoginId}</span>
          <select value={selectedClubId} onChange={e => setSelectedClubId(e.target.value)}>
            {loginClubs.map(club => (
              <option key={club.id} value={club.id}>
                {[club.toastmasterId, club.clubName].filter(Boolean).join(' - ') || club.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t.email}</span>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </label>
        <label>
          <span>{t.password}</span>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </label>
        {error && <p className="tm-error">{error}</p>}
        <div className="tm-login-actions">
          <button disabled={busy || !selectedClubId || !email || !password} onClick={() => submit('login')}>{t.login}</button>
          <button disabled={busy || !selectedClubId || !email || !password} className="tm-outline" onClick={() => submit('signup')}>{t.createAccount}</button>
        </div>
      </div>
    </div>
  )
}

function ClubSwitcher({ clubs, selectedClubId, onChange, t, disabled = false }) {
  const selectedClub = selectedClubId === 'default'
    ? { clubName: t.defaultClub }
    : clubs.find(club => club.id === selectedClubId)
  const label = selectedClub?.clubName || selectedClub?.toastmasterId || selectedClubId || t.defaultClub
  const toastmasterId = selectedClub?.toastmasterId || localStorage.getItem('tm-login-toastmaster-id') || selectedClubId || 'default'

  return (
    <div className="tm-club-switcher">
      <span>{t.currentClub}</span>
      {disabled ? (
        <b className="tm-locked-club">{label}</b>
      ) : (
        <select value={selectedClubId} onChange={event => onChange(event.target.value)}>
          <option value="default">{t.defaultClub}</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>{club.clubName || club.toastmasterId || club.id}</option>
          ))}
        </select>
      )}
      <small>Toastmaster ID: {toastmasterId}</small>
      <small>{t.switchClubHint}</small>
    </div>
  )
}

function CurrentUserCard({ user, roleLabel, t }) {
  if (!user) return null
  return (
    <div className="tm-current-user">
      <span>{t.currentUser}</span>
      <b>{user.email}</b>
      <small>{roleLabel}</small>
    </div>
  )
}

export default function ToastmastersVote() {
  const [data, setData] = useState(null)
  const [people, setPeople] = useState({ members: [], guests: [] })
  const [meetingOps, setMeetingOps] = useState({ attendance: [], roles: [] })
  const [settings, setSettings] = useState({
    clubName: '',
    clubShort: '',
    toastmasterId: '',
    adminName: '',
    username: '',
    logoDataUrl: '',
    agendaTemplateName: '',
    agendaTemplateDataUrl: '',
    agendaLanguage: 'auto',
    clubAdmins: [],
  })
  const publicMode = new URLSearchParams(window.location.search).get('view') || ''
  const publicView = publicMode === 'vote'
  const publicTimerView = publicMode === 'timer'
  const publicToolView = publicView || publicTimerView
  const publicSpace = new URLSearchParams(window.location.search).get('space') || ''
  const publicClub = new URLSearchParams(window.location.search).get('club') || 'default'
  const [view, setView] = useState(publicView ? 'vote' : publicTimerView ? 'timer' : 'system')
  const [lang, setLang] = useState(() => localStorage.getItem('tm-vote-lang') || 'zh')
  const [managedClubs, setManagedClubs] = useState(() => loadManagedClubs())
  const [selectedClubId, setSelectedClubId] = useState(() => publicToolView ? publicClub : getActiveClubId())
  const [openNavGroups, setOpenNavGroups] = useState({})
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isCloudConfigured || publicToolView)
  const [source, setSource] = useState(isCloudConfigured ? 'cloud' : 'local')
  const [syncStatus, setSyncStatus] = useState('')
  const t = LANG[lang]
  const appText = {
    ...t,
    club: settings.clubName || t.club,
    clubShort: settings.clubShort || t.clubShort,
  }
  const workspaceId = user?.id || publicSpace || (isCloudConfigured ? getRememberedWorkspaceId() : getLocalWorkspaceId())
  const effectiveVoteLink = publicView
    ? window.location.href
    : data?.meeting?.link || getPublicVoteUrl(workspaceId, selectedClubId, data?.meeting?.id || '')
  const effectiveTimerLink = publicTimerView
    ? window.location.href
    : getPublicTimerUrl(workspaceId, selectedClubId, data?.meeting?.id || '')

  useEffect(() => {
    setActiveClubId(selectedClubId)
  }, [selectedClubId])

  useEffect(() => {
    if (user?.id) rememberWorkspaceId(user.id)
  }, [user])

  useEffect(() => {
    if (!isCloudConfigured || publicToolView) return undefined
    let mounted = true
    getCurrentUser().then(currentUser => {
      if (!mounted) return
      setUser(currentUser)
      setAuthReady(true)
    })
    const unsubscribe = onAuthChange(nextUser => {
      setUser(nextUser)
      setAuthReady(true)
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [publicToolView])

  useEffect(() => {
    let ignore = false
    async function hydrate() {
      if (!authReady || (!publicToolView && isCloudConfigured && !user)) return
      setSyncStatus(t.syncing)
      try {
        setActiveClubId(publicToolView ? publicClub : selectedClubId)
        const result = await loadVoteState(publicToolView ? publicSpace : '', publicToolView ? publicClub : selectedClubId)
        if (!ignore) {
          setData(normalizeState(result.data))
          setSource(result.source)
          setSyncStatus('')
        }
      } catch {
        if (!ignore) {
          setData(normalizeState(loadLocalState()))
          setSource('local')
          setSyncStatus(t.loadFailed)
        }
      }
    }
    hydrate()
    return () => { ignore = true }
  }, [authReady, user, publicToolView, publicSpace, publicClub, selectedClubId])

  useEffect(() => {
    let ignore = false
    async function hydratePeople() {
      if ((!publicTimerView && publicView) || !authReady || (!publicTimerView && isCloudConfigured && !user)) return
      try {
        setActiveClubId(publicTimerView ? publicClub : selectedClubId)
        const result = await loadPeopleState(publicTimerView ? publicSpace : '', publicTimerView ? publicClub : selectedClubId)
        if (!ignore) {
          setPeople(result.data)
          if (result.warning) setSyncStatus(result.warning)
        }
      } catch {
        if (!ignore) setPeople({ members: [], guests: [] })
      }
    }
    hydratePeople()
    return () => { ignore = true }
  }, [authReady, user, publicView, publicTimerView, publicSpace, publicClub, selectedClubId])

  useEffect(() => {
    let ignore = false
    async function hydrateSettings() {
      if (!authReady || (!publicToolView && isCloudConfigured && !user)) return
      try {
        setActiveClubId(publicToolView ? publicClub : selectedClubId)
        const result = await loadSystemSettings(publicToolView ? publicSpace : '')
        if (!ignore) {
          const fallbackToastmasterId = result.data.toastmasterId || localStorage.getItem('tm-login-toastmaster-id') || selectedClubId || 'default'
          setSettings({
            ...result.data,
            toastmasterId: fallbackToastmasterId,
            agendaLanguage: result.data.agendaLanguage || 'auto',
            clubAdmins: (result.data.clubAdmins || []).map(admin => ({
              ...admin,
              toastmasterId: admin.toastmasterId || fallbackToastmasterId,
            })),
          })
        }
      } catch {
        if (!ignore) setSettings({ clubName: t.club, clubShort: t.clubShort, toastmasterId: '', adminName: '', username: '', logoDataUrl: '', agendaTemplateName: '', agendaTemplateDataUrl: '', agendaLanguage: 'auto', clubAdmins: [] })
      }
    }
    hydrateSettings()
    return () => { ignore = true }
  }, [authReady, user, publicToolView, publicSpace, publicClub, selectedClubId])

  useEffect(() => {
    let ignore = false
    async function hydrateMeetingOps() {
      if ((!publicTimerView && publicView) || !authReady || (!publicTimerView && isCloudConfigured && !user) || !data?.meeting?.id) return
      try {
        setActiveClubId(publicTimerView ? publicClub : selectedClubId)
        const result = await loadMeetingOpsState(data.meeting.id, publicTimerView ? publicSpace : '', publicTimerView ? publicClub : selectedClubId)
        if (!ignore) setMeetingOps(result.data)
      } catch {
        if (!ignore) setMeetingOps({ attendance: [], roles: [] })
      }
    }
    hydrateMeetingOps()
    return () => { ignore = true }
  }, [authReady, user, publicView, publicTimerView, publicSpace, publicClub, data?.meeting?.id, selectedClubId])

  useEffect(() => {
    if (publicView || !authReady || (isCloudConfigured && !user) || !['results', 'history'].includes(view)) return undefined
    let ignore = false
    async function refreshResults() {
      try {
        setActiveClubId(selectedClubId)
        const result = await loadVoteState('', selectedClubId)
        if (!ignore) {
          setData(normalizeState(result.data))
          setSource(result.source)
        }
      } catch (err) {
        if (!ignore) setSyncStatus(err.message || t.loadFailed)
      }
    }
    refreshResults()
    return () => { ignore = true }
  }, [authReady, user, publicView, view, selectedClubId, t.loadFailed])

  function switchClub(clubId) {
    setSelectedClubId(clubId)
    setActiveClubId(clubId)
    setData(null)
    setPeople({ members: [], guests: [] })
    setMeetingOps({ attendance: [], roles: [] })
    setSettings({ clubName: '', clubShort: '', toastmasterId: '', adminName: '', username: '', logoDataUrl: '', agendaTemplateName: '', agendaTemplateDataUrl: '', agendaLanguage: 'auto', clubAdmins: [] })
    setView('system')
  }

  function changeLang(nextLang) {
    setLang(nextLang)
    localStorage.setItem('tm-vote-lang', nextLang)
  }

  async function persistState(next) {
    setSyncStatus(t.syncing)
    try {
      const result = await saveVoteState(next)
      if (result.data) setData(normalizeState(result.data))
      setSource(result.source)
      setSyncStatus(t.saved)
      return result.data ? normalizeState(result.data) : next
    } catch (err) {
      setSyncStatus(err.message || t.saveFailed)
      throw err
    }
  }

  async function persistPeople(next) {
    setSyncStatus(t.syncing)
    try {
      const result = await savePeopleState(next)
      setSyncStatus(result.warning || t.peopleSaved)
    } catch (err) {
      setSyncStatus(err.message || t.saveFailed)
      throw err
    }
  }

  async function persistMeetingOps(next, meetingId = '') {
    setSyncStatus(t.syncing)
    try {
      await saveMeetingOpsState(next, meetingId)
      setSyncStatus(t.meetingSaved)
    } catch (err) {
      setSyncStatus(err.message || t.saveFailed)
      throw err
    }
  }

  async function saveAndCopyTimerLink() {
    if (!data) return
    setSyncStatus(t.syncing)
    const savedData = await persistState(data) || data
    const activeMeetingId = savedData.meeting?.id || data.meeting?.id || ''
    await persistMeetingOps(meetingOps, activeMeetingId)
    const link = getPublicTimerUrl(workspaceId, selectedClubId, activeMeetingId)
    await copyText(link)
    setSyncStatus(t.copied)
  }

  async function persistSettings(next) {
    if (!superAdmin) {
      setSyncStatus(t.saveFailed)
      return
    }
    setSyncStatus(t.syncing)
    try {
      await saveSystemSettings(next)
      setSyncStatus(t.systemSaved)
    } catch {
      setSyncStatus(t.saveFailed)
    }
  }

  async function handleLogout() {
    await signOutUser()
    setUser(null)
    setData(null)
  }

  const superAdmin = isSuperAdmin(user)
  const clubAdmin = isClubAdmin(user, settings)
  const canManageClubSettings = superAdmin || clubAdmin
  const roleLabel = superAdmin ? appText.roleSuperAdmin : clubAdmin ? appText.roleClubAdmin : appText.roleUser

  const navGroups = useMemo(() => [
    {
      id: 'meeting',
      label: t.navGroupMeeting,
      items: [
        ['meeting', t.navMeeting],
        ['timer', t.navTimer],
        ['people', t.navPeople],
      ],
    },
    {
      id: 'vote',
      label: t.navGroupVote,
      items: [
        ['admin', t.navAdmin],
        ['vote', t.navVote],
        ['share', t.navShare],
        ['results', t.navResults],
        ['history', t.navHistory],
      ],
    },
    {
      id: 'admin',
      label: t.navGroupAdmin,
      items: [
        ['system', t.navSystem],
        ['master', t.navMaster],
      ].filter(([key]) => (key !== 'system' || canManageClubSettings) && (key !== 'master' || superAdmin)),
    },
  ].filter(group => group.items.length), [t, canManageClubSettings, superAdmin])

  useEffect(() => {
    const activeGroup = navGroups.find(group => group.items.some(([key]) => key === view))
    if (activeGroup) {
      setOpenNavGroups(current => ({ ...current, [activeGroup.id]: true }))
    }
  }, [navGroups, view])

  useEffect(() => {
    if (!publicToolView && authReady && user && !canManageClubSettings && ['system', 'master'].includes(view)) {
      setView('meeting')
    }
    if (!publicToolView && authReady && user && !superAdmin && view === 'master') {
      setView(canManageClubSettings ? 'system' : 'meeting')
    }
  }, [authReady, user, publicToolView, view, superAdmin, canManageClubSettings])

  if (!authReady) {
    return <div className="tm-success-card"><h2>{appText.syncing}</h2></div>
  }

  if (!publicToolView && isCloudConfigured && !user) {
    return <LoginView lang={lang} setLang={changeLang} t={t} onLogin={setUser} />
  }

  if (!data) {
    return (
      <div className={`tm-page ${publicToolView ? 'public' : ''}`}>
        {!publicToolView && <aside className="tm-sidebar">
          <div className="tm-brand">Toastmasters</div>
          <LanguageToggle lang={lang} setLang={changeLang} t={appText} />
        </aside>}
        <main className="tm-content">
          <div className="tm-success-card"><h2>{appText.syncing}</h2></div>
        </main>
      </div>
    )
  }

  if (publicToolView && isCloudConfigured && !publicSpace) {
    return (
      <div className="tm-page public">
        <main className="tm-content">
          <div className="tm-success-card">
            <h2>{appText.notOpen}</h2>
            <p>{appText.missingSpace}</p>
          </div>
        </main>
      </div>
    )
  }

  if (publicToolView && !isCloudConfigured) {
    return (
      <div className="tm-page public">
        <main className="tm-content">
          <div className="tm-success-card">
            <h2>{appText.cloudNotReadyTitle}</h2>
            <p>{appText.cloudNotReadyVoter}</p>
            <a className="tm-card-action" href={getSettingsUrl()}>{appText.openSettings}</a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={`tm-page ${publicToolView ? 'public' : ''}`}>
      {!publicToolView && <aside className="tm-sidebar">
        <div className="tm-brand">{appText.clubShort}</div>
        <LanguageToggle lang={lang} setLang={changeLang} t={appText} />
        <ClubSwitcher clubs={managedClubs} selectedClubId={selectedClubId} onChange={switchClub} t={appText} disabled={!superAdmin} />
        <CurrentUserCard user={user} roleLabel={roleLabel} t={appText} />
        {isCloudConfigured && <button onClick={handleLogout}>{appText.logout}</button>}
        <div className="tm-sidebar-menu">
          {navGroups.map(group => (
            <div key={group.label} className="tm-nav-group">
              <button
                type="button"
                className="tm-nav-group-toggle"
                onClick={() => setOpenNavGroups(current => ({ ...current, [group.id]: !(current[group.id] ?? group.items.some(([key]) => key === view)) }))}
              >
                <span>{group.label}</span>
                <b>{(openNavGroups[group.id] ?? group.items.some(([key]) => key === view)) ? '-' : '+'}</b>
              </button>
              {(openNavGroups[group.id] ?? group.items.some(([key]) => key === view)) && (
                <div className="tm-nav-submenu">
                  {group.items.map(([key, label]) => (
                    <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>}
      <main className="tm-content">
        {view === 'system' && canManageClubSettings && <SystemSettingsView settings={settings} setSettings={setSettings} persistSettings={persistSettings} syncStatus={syncStatus} t={appText} superAdmin={superAdmin} />}
        {view === 'master' && superAdmin && <MasterAdminView settings={settings} t={appText} onClubsChange={setManagedClubs} />}
        {view === 'admin' && <AdminView data={data} setData={setData} setView={setView} persistState={persistState} source={source} syncStatus={syncStatus} t={appText} people={people} meetingOps={meetingOps} spaceId={workspaceId} voteLink={effectiveVoteLink} />}
        {view === 'people' && <PeopleView people={people} setPeople={setPeople} persistPeople={persistPeople} syncStatus={syncStatus} t={appText} />}
        {view === 'meeting' && <MeetingView data={data} setData={setData} persistState={persistState} people={people} setPeople={setPeople} persistPeople={persistPeople} meetingOps={meetingOps} setMeetingOps={setMeetingOps} persistMeetingOps={persistMeetingOps} syncStatus={syncStatus} t={appText} settings={settings} voteLink={effectiveVoteLink} />}
        {view === 'timer' && <TimerView data={data} people={people} meetingOps={meetingOps} settings={settings} t={appText} spaceId={workspaceId} clubId={publicTimerView ? publicClub : selectedClubId} publicTimer={publicTimerView} timerLink={effectiveTimerLink} onCopyTimerLink={saveAndCopyTimerLink} />}
        {view === 'vote' && <VoteView data={data} setData={setData} setView={setView} t={appText} spaceId={workspaceId} />}
        {view === 'success' && <div className="tm-success-card"><h1>{appText.thankVote}</h1><p>{appText.recorded}</p></div>}
        {view === 'share' && <SharePoster data={data} t={appText} voteLink={effectiveVoteLink} />}
        {view === 'results' && <ResultsView data={data} t={appText} />}
        {view === 'history' && <HistoryView data={data} t={appText} />}
      </main>
    </div>
  )
}
