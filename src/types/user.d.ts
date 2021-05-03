export type IUser = {
    uid: string;
    name: string,
    avatar: string,
    tasks: {
        [uid:string]: ITask,
    },
};

export type ITask = {
    text: string,
    user: string,
    uid: string,
};