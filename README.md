# 学习案例

## 环境说明

```sh
node -v # v16.8.0 如果遇到错误无法解决可能是版本问题
npm -v # 7.21.0
```

## ICP SDK 安装

```sh
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
dfx --version # dfx 0.8.3
dfx --help
```

## 1. hello 第一次了解

下载项目模板

```sh
dfx new hello
cd hello # 进入项目目录
```

启动执行环境

```sh
dfx start # 启动本地执行环境 一直占用窗口 Ctrl+C 可停止运行
# dfx start --background # 后台执行
# dfx stop # 停止本机运行的执行环境
```

部署项目到本地环境

```sh
npm install # 下载依赖包
dfx deploy # 部署完成后 可通过 http://127.0.0.1:8000/?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai (注意canisterId正确与否) 访问页面
# http://ryjl3-tyaaa-aaaaa-aaaba-cai.localhost:8000 也可以
dfx canister call hello greet everyone # hello 是项目名称，命令行方式直接调用后端提供的接口
# ("Hello, everyone!") 输出
```

开发本地运行测试

```sh
npm start # 测试启动 可用过 http://localhost:8080/ 访问页面
# yarn start 差不多命令
# 即使我下载最新模板，该命令也无法顺利执行 原因 webpack-cli 版本低了 2 个小版本？？？
# npm install webpack-cli && npm update webpack-cli
# yarn add -D webpack-cli # yarn 方式
```

## 2. explore_hello 解释编译构建过程

```sh
dfx new explore_hello
ls -l explore_hello # 展示项目结构
cd explore_hello
# cat dfx.json 文件为项目配置信息
# cat src/explore_hello/main.mo 后端代码入口？

dfx start # 在另一个终端项目目录下执行 启动本地执行环境

dfx canister create --all # 为所有 canister 注册唯一的识别号
# cat .dfx/local/canister_ids.json # 识别号记录在该文件内 本地

dfx build # 编译构建项目
# cat .dfx/local/canisters/ # 生成的代码位置
# -rw-r--r--  1 gleam  staff      41 11 11 13:59 explore_hello.did # 接口描述文件
# -rw-r--r--  1 gleam  staff     128 11 11 13:59 explore_hello.did.d.ts # JavaScript接口描述文件
# -rw-r--r--  1 gleam  staff     167 11 11 13:59 explore_hello.did.js # 接口的 JavaScript 实现
# -rw-r--r--  1 gleam  staff  165262 11 11 13:59 explore_hello.wasm # 项目用到的编译后的 WebAssembly 模块
# -rw-r--r--  1 gleam  staff    1465 11 11 13:59 index.js
# src/declarations 目录也有一份记录

dfx canister install --all # 部署所有的 canister
dfx canister call explore_hello greet '("everyone": text)' # 调用命令

# 前端代码
cat src/explore_hello_assets/src/index.js # 该文件会在 index.html 展示时自动加载
ls -l .dfx/local/canisters/explore_hello_assets/ # 编译后的文件内容
npm start # 本地运行测试 通过 http://127.0.0.1:8080 访问

dfx stop # t停止本地执行环境
```

## 3. actor_hello 后端模块 query 函数

```sh
dfx new actor_hello
cd actor_hello
# 编辑 dfx.json 文件 移除前端部分
```

编辑 main.mo 覆盖下面代码

```motoko
import Debug "mo:base/Debug";
actor HelloActor {
    // public query func 标识查询函数 不修改状态
    public query func hello() : async () {
        Debug.print ("Hello, World from DFINITY \n");
    }
};
```

```sh
dfx build --check # 编译检查

dfx start # 其他终端

dfx canister create actor_hello # 仅创建 actor_hello 模块的识别符
dfx build # 编译
dfx canister install actor_hello # 部署

dfx canister call actor_hello hello # 调用部署的模块函数 可以在 start 的终端看到输出的日志
```

## 4. location_hello 后端模块 和 参数可视化

```sh
dfx new location_hello
cd location_hello

### 修改代码
actor {
  public func location(city : Text) : async Text {
    return "Hello, " # city # "!";
  };
};
###

dfx start
dfx deploy
dfx canister call location_hello location "San Francisco"
dfx canister call location_hello location '("San Francisco and Paris")'
dfx canister call location_hello location '("San Francisco","Paris","Rome")' # 只取第一个参数


# 修改 dfx.json 增加 favorite_cities 模块
# 复制一份代码
cp -r src/location_hello src/favorite_cities

### 修改代码
actor {
  public func location(cities : [Text]) : async Text {
    return "Hello, from " # (debug_show cities) # "!";
  };

  public func location_pretty(cities : [Text]) : async Text {
    var str = "Hello from ";
    for (city in cities.vals()) {
      str := str # city #", ";
    };
    return str # "bon voyage!";
  }
};
###
dfx deploy
dfx canister call favorite_cities location '(vec {"San Francisco";"Paris";"Rome"})' # 数组形式调用
dfx canister call favorite_cities location_pretty '(vec {"San Francisco";"Paris";"Rome"})'

# UI测试
dfx canister id __Candid_UI # 获取当前模块的 识别号
# 访问 http://127.0.0.1:8000/?canisterId=xxx xxx是deploy时UI id
# 打开页面 1.输入对应的 canister id 2.选择对应的 .did 文件 3.进入可视化参数列表界面
# 选择文件 貌似看不到 .dfx 文件夹 麻烦
```

## 5. my_counter 数据持久化

```sh
dfx new my_counter
cd my_counter
# dfx.json 修改 "main": "src/my_counter/increment_counter.mo"
mv src/my_counter/main.mo src/my_counter/increment_counter.mo # 移动文件

### 编辑文件 src/my_counter/increment_counter.mo
// Create a simple Counter actor.
actor Counter {
  stable var currentValue : Nat = 0;

  // Increment the counter with the increment function.
  public func increment() : async () {
    currentValue += 1;
  };

  // Read the counter value with a get function.
  public query func get() : async Nat {
    currentValue
  };

  // Write an arbitrary value with a set function.
  public func set(n: Nat) : async () {
    currentValue := n;
  };
}
###
# 变量名前的 stable 关键字表示这个变量会进行持久化  !! 会确保变量的值在程序升级的过程中不会改变，，这点很重要
# Nat nature 自然数 就是非负整数
# 2个更新方法，1 个查询方法

dfx start
dfx deploy
dfx canister call my_counter get # get 函数
dfx canister call my_counter increment # 自增修改
dfx canister call my_counter get
dfx canister call my_counter set '(987)' # 设置修改
dfx canister call my_counter get

# ui 测试
```

## 6. Calc 演示基本的算术运算

```sh
dfx new calc
cd calc
# dfx.json "main": "src/calc/calc_main.mo",
cp src/calc/main.mo src/calc/calc_main.mo
###
// This single-cell calculator defines one calculator instruction per
// public entry point (add, sub, mul, div).

// Create a simple Calc actor.
actor Calc {
  var cell : Int = 0;

  // Define functions to add, subtract, multiply, and divide
  public func add(n:Int) : async Int { cell += n; cell };
  public func sub(n:Int) : async Int { cell -= n; cell };
  public func mul(n:Int) : async Int { cell *= n; cell };
  public func div(n:Int) : async ?Int {
    if ( n == 0 ) {
      return null // null indicates div-by-zero error
    } else {
      cell /= n; ?cell
    }
  };

  // Clear the calculator and reset to zero
  public func clearall() : async Int {
    if (cell : Int != 0)
      cell -= cell;
    return cell
  };
 };
###
dfx start
dfx deploy
dfx canister call calc add '(10)'
dfx canister call calc mul '(3)'
dfx canister call calc sub '(5)'
dfx canister call calc div '(5)'
dfx canister call calc mul '(-4)'
dfx canister call calc clearall
```

## 7. Import library modules

```sh
dfx new phonebook
cd phonebook
### src/phonebook/main.mo
// Import standard library functions for lists

import L "mo:base/List";
import A "mo:base/AssocList";

// The PhoneBook actor.
actor {

    // Type aliases make the rest of the code easier to read.
    public type Name = Text;
    public type Phone = Text;

    // The actor maps names to phone numbers.
    flexible var book: A.AssocList<Name, Phone> = L.nil<(Name, Phone)>();

    // An auxiliary function checks whether two names are equal.
    func nameEq(l: Name, r: Name): Bool {
        return l == r;
    };

    // A shared invokable function that inserts a new entry
    // into the phone book or replaces the previous one.
    public func insert(name: Name, phone: Phone): async () {
        let (newBook, _) = A.replace<Name, Phone>(book, name, nameEq, ?phone);
        book := newBook;
    };

    // A shared read-only query function that returns the (optional)
    // phone number corresponding to the person with the given name.
    public query func lookup(name: Name): async ?Phone {
        return A.find<Name, Phone>(book, name, nameEq);
    };
};
###

dfx start --clean
dfx deploy phonebook # 只部署 1 个
dfx canister call phonebook insert '("Chris Lynn", "01 415 792 1333")'
dfx canister call phonebook insert '("Maya Garcia", "01 408 395 7276")'
dfx canister call phonebook lookup '("Chris Lynn")'
dfx canister call phonebook lookup '("01 408 395 7276")'
dfx canister call phonebook lookup '("Maya Garcia","Chris Lynn")'
```

## 8. Use multiple actors

```sh
dfx new multiple_actors
cd multiple_actors
### dfx.json
"assistant": {
    "main": "src/assistant/main.mo",
    "type": "motoko"
},
"rock_paper_scissors": {
    "main": "src/rock_paper_scissors/main.mo",
    "type": "motoko"
},
"daemon": {
    "main": "src/daemon/main.mo",
    "type": "motoko"
}
### src/assistant/main.mo
# remove multiple_actors_assets
cp -r src/multiple_actors/ src/assistant/
cp -r src/assistant/ src/rock_paper_scissors/
cp -r src/assistant/ src/daemon/
### src/assistant/main.mo
import Array "mo:base/Array";
import Nat "mo:base/Nat";

// Define the actor
actor Assistant {

  stable var todos : [ToDo] = [];
  stable var nextId : Nat = 1;

  // Define to-do item properties
  type ToDo = {
    id : Nat;
    description : Text;
    completed : Bool;
  };

  // Add to-do item utility
  func add(todos : [ToDo], description : Text, id : Nat) : [ToDo] {
    let todo : ToDo = {
      id = id;
      description = description;
      completed = false;
    };
    Array.append(todos, [todo])
};

  // Show to-do item utility
  func show(todos : [ToDo]) : Text {
    var output : Text = "\n___TO-DOs___";
    for (todo : ToDo in todos.vals()) {
      output #= "\n(" # Nat.toText(todo.id) # ") " # todo.description;
      if (todo.completed) { output #= " ✔"; };
    };
    output
  };

  public func addTodo (description : Text) : async () {
    todos := add(todos, description, nextId);
    nextId += 1;
  };

  public query func showTodos () : async Text {
    show(todos)
  };

};
###

### src/rock_paper_scissors/main.mo
import I "mo:base/Iter";

actor RockPaperScissors {

  stable var alice_score : Nat = 0;
  stable var bob_score : Nat = 0;
  stable var alice_last : Choice = #scissors;
  stable var bob_last : Choice = #rock;

  type Choice = {
    #rock;
    #paper;
    #scissors;
  };

  public func contest() : async Text {
    for (i in I.range(0, 99)) {
      battle_round();
    };
    var winner = "The contest was a draw";
    if (alice_score > bob_score) winner := "Alice won"
    else if (alice_score < bob_score) winner := "Bob won";
    return (winner);
  };

  func battle_round() : () {
    let a = alice(bob_last);
    let b = bob(alice_last);

    switch (a, b) {
      case (#rock, #scissors) alice_score += 1;
      case (#rock, #paper) bob_score += 1;
      case (#paper, #scissors) alice_score += 1;
      case (#paper, #rock) bob_score += 1;
      case (#scissors, #paper) alice_score += 1;
      case (#scissors, #rock) bob_score += 1;
      case (#rock, #rock) alice_score += 0;
      case (#paper, #paper) bob_score += 0;
      case (#scissors, #scissors) alice_score += 0;
    };

    alice_last := a;
    bob_last := b;

    return ();
  };

  // Hard-coded players and choices
  func bob(last : Choice) : Choice {
    return #paper;
  };

  func alice(last : Choice) : Choice {
    return #rock;
  };
};
###

### src/daemon/main.mo
actor Daemon {
  stable var running = false;

  public func launch() : async Text {
    running := true;
    debug_show "The daemon process is running";
  };

  public func stop(): async Text {
    running := false;
    debug_show "The daemon is stopped";
  };
};
###
dfx start
dfx deploy
dfx canister call assistant addTodo '("Schedule monthly demos")'
dfx canister call assistant showTodos
dfx canister call rock_paper_scissors contest
dfx canister call daemon launch
```

## 9. Customize the front-end

[自己看吧](https://sdk.dfinity.org/docs/developers-guide/tutorials/custom-frontend.html)

```sh
dfx new custom_greeting
cd custom_greeting

npm install --save react react-dom
npm install --save-dev typescript ts-loader


```

## 10. Add a stylesheet

[自己看](https://sdk.dfinity.org/docs/developers-guide/tutorials/my-contacts.html)

```sh
dfx new contacts
cd contacts

npm install --save react react-dom
npm install --save-dev typescript ts-loader
npm install --save-dev style-loader css-loader
```

## 11. Make inter-canister calls

[see](https://sdk.dfinity.org/docs/developers-guide/tutorials/intercanister-calls.html)

## 12. Create scalable apps

[see](https://sdk.dfinity.org/docs/developers-guide/tutorials/scalability-cancan.html)

## 13. Add access control with identities

[see](https://sdk.dfinity.org/docs/developers-guide/tutorials/access-control.html)
