export type IUser = {
    name: string,
    avatar: string,
    tasks: {
        [uid:string]: ITask,
    },
};

export type ITask = {
    text: string,
};