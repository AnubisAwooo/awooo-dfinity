import Debug "mo:base/Debug";

actor HelloActor {
    // public query func 标识查询函数 不修改状态
    public query func hello() : async () {
        Debug.print ("Hello, World from DFINITY \n");
    }
};
