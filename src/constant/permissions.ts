const UserPermissions = {
    admin: {
        getStaffs: 'admin:GET_STAFF',
        createStaff: 'admin:CREATE_STAFF',
        viewUserProfile: 'admin:VIEW_USER_PROFILE',
        viewCleaners: 'admin:VIEW_CLEANERS',
        viewInspector: 'admin:VIEW_INSPECTORS',
        viewAllUsers: 'admin:VIEW_ALL_USERS',
        getStaffByName: 'admin:GET_STAFF_BY_NAME',
        fireStaff: 'admin:FIRE_STAFF',
        restoreStaff: 'admin:RESTORE_STAFF',

        createRoom: 'admin:CREATE_ROOM',
        getAllRoom: 'admin:GET_ALL_ROOM',
        getSingleRoom: 'admin:GET_SINGLE_ROOM',
        updateRoom: 'admin:UPDATE_ROOM',
        deletRoom: 'admin:DELETE_ROOM',
        getUnassignedRoom: 'admin:UNASSIGNED_ROOM',
        roomByLocation: 'admin:ROOM_BY_LOCATION',

        createTask: 'admin:CREATE_TASK',
        getTask: 'admin:GET_TASK',
        getSingleTask: 'admin:GET_SINGLE_TASK',
        updateTask: 'admin:UPDATE_TASK',
        deleteTask: 'admin:DELETE_TASK',

        getRole: 'admin:GET_ROLE',
        addRole: 'admin:admin:ADD_ROLE',
        updateRole: 'admin:UPDATE_ROLE',
        deleteRole: 'admin:DELETE:ROLE',
        assignRole: 'admin:ASSIGN_ROLE',
        getStaffRole: 'admin:GET_STAFF_ROLE',

        addPermission: 'admin:ADD_PERMISSION',
        getPermissions: 'admin:GET_PERMISSION',
        getPermissionByRoleId: 'admin:GET_PERMISSION_BY_ROLEID',
        updatePermission: 'admin:UPDATE_PERMISSION',
        deletePermission: 'admin:DELETE_PERMISSION',
        assignPermission: 'admin:ASSIGN_PERMISSION',

        addLocation: 'admin:ADD_LOCATION',
        editLocation: 'admin:EDIT_LOCATION',
        deleteLocation: 'admin:DELETE_LOCATION',
        viewLocation: 'admin:VIEW_LOCATION',
        viewLocationBId: 'admin:VIEW_LOCATION_ID',

        viewEvidence: 'admin:GET_ROOM_EVIDENCE',
        viewUploadedImages: 'admin:VIEW_UPLOADED_IMAGES',

        viewRoomHistory: 'admin:VIEW_ROOM_HISTORY',
        viewCleanerHistory: 'admin:VIEW_CLEANER_HISTORY',
        viewInspectorHistory: 'admin:VIEW_INSPECTOR_HISTORY',
        viewCleanerTaskSummary: 'admin:VIEW_CLEANER_TASK_SUMMARY',

        viewUserRole: 'admin:VIEW_USER_ROLE',
        deleteUserRole: 'admin:DELETE_USER_ROLE',

        createCourse: 'admin:ADD_COURSE',
        getSingleCourse: 'admin:GET_COURSE',
        getAllCourse: 'admin:GET_ALL_COURSE',
        updateCourse: 'admin:UPDATE_COURSE',
        deleteCourse: 'admin:DELETE_COURSE',
        publishCourse: 'admin:PUBLISH_COURSE',
        unpublishCourse: 'admin:UNPUBLISH_COURSE',
        enrollCourse: 'admin:ENROLL_COURSE',
        unenrollFromCourse: 'admin:UNENROLL_FROM_COURSE',
        blockLearner: 'admin:BLOCK_LEARNER',
        removeLearner: 'admin:REMOVE_LEARNER'
    },

    cleanerPermission: {
        getRoom: 'cleaner:GET_ROOM',
        getLocation: 'cleaner:GET_LOCATION',
        uploadImage: 'cleaner:UPLOAD_IMAGE',
        getRoomDetail: 'cleaner:GET_ROOM_DETAIL',
        submitTask: 'cleaner:SUBMIT_TASK'
    },
    inspectorPermission: {
        getRoom: 'inspector:GET_ROOM',
        getLocation: 'inspector:GET_LOCATION',
        getRoomDetail: 'inspector:GET_ROOM_DETAIL',
        approveTask: 'inspector:SUBMIT_TASK' //also known as update task item
    },

}
export { UserPermissions }