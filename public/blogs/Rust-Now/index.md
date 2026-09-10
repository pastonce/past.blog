> * 本系列主要基于杨旭老师的教程视频进行学习，
>
> [![](/blogs/Rust-Now/420202096b5e27fc.png)](https://www.bilibili.com/video/BV1m1sreSEoh)
> * [Rust 程序设计语言](https://kaisery.github.io/trpl-zh-cn/title-page.html)
> * [Rust Crates](https://crates.io/)
> * [Rust 中文文档](https://rustwiki.org/docs/)

Rust 是一种**非常高效**的**低级别**的系统编程语言，能够编译为运行速度极快的可执行程序，兼具高层次的易用性和低层次的控制力；具有**高度的安全性**，Rust 通过对内存所有权的严格限制和**友好的编译器**确保了其安全性；拥有非常好用的**统一包管理器 cargo**. 用途广泛，包括命令行工具、Web服务、嵌入式设备等。

## 安装

* 首先需要安装[Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/zh-hans/downloads/)，实测只需安装 MSVC C++ 生成工具以及 Windows SDK 两个单独组件即可
* 安装 [Rustup](https://www.rust-lang.org/tools/install)，工具链默认采用 MSVC（相比 GNU，使用 MSVC 构建得到的可执行文件一般更小，且不会被识别为病毒），升级：`rustup update`；卸载：`rustup self uninstall`
* 安装 [RustRover](https://www.jetbrains.com/zh-cn/rust/)，即编写 Rust 代码专用的 Idle，当然也可以使用 VS code 安装 rust-analyzer 插件后进行编写运行

## 一个简单的 Rust 程序

使用`cargo new project`创建一个项目，并在项目文件夹中运行`rustrover64 .`既可开始编写代码。一个新创建的项目的文件结构如下：

```
-project
--src
---main.rs
--Cargo.lock
--Cargo.toml
```

* `Cargo.toml`文件中包含了项目的名字、版本号、使用的 Rust 版本以及添加的`crate`等信息
* `Cargo.lock`则在 build 时自动生成，主要包含`Cargo.toml`中使用的`crate`的各种依赖信息

Python 中的包、C/C++ 中的库对应到 Rust 中就是**箱`crate`**；**一个 Rust 项目最终结果是得到一个且只能有一个 library crate，但可以有任意多个 binary crate.**

```rust
use std::io::stdin;

fn main() {
    let mut msg = String ::new();
    println!("Please enter message:"); // println! 是一个宏，可以将指定内容打印到控制台
    stdin().read_line(&mut msg).unwrap(); // & 在 Rust 中同样可以表示引用，&mut 则表示可变引用
    println!("Message is {}", msg);
}
```

类似于 C/C++：

* 一个 Rust 程序的入口点也是一个 main 函数
* 也拥有自己的 std 标准库，且 std 中的一部分常用功能（prelude）会默认包含在每个 Rust 程序中
* **分号`;`**是结束任何语句所必需的符号
* 程序先编译再执行，对没有外部依赖的简单程序可以**使用`rustc main.rs`编译+`.\main.exe`执行**，比较复杂的程序则最好**使用`cargo run`自动编译执行**，RustRover 中的运行步骤即是后者

## 猜数游戏

* `use`可以导入需要的库，类似于 C/C++ 中的 include
* 添加外部库（`crate`）的两种方法：
    * 在`Cargo.toml`文件中输入`rand=0.8.5`保存后重新编译
    * 在控制台运行`cargo add rand@0.8.5`，不添加版本号则默认最新，两种方法都是从[官方库网站](https://crates.io/)下载获取的
    * 控制台**运行`cargo update`即可更新所有用到的外部库**

```rust
use std::cmp::Ordering;
use std::io;
use rand::Rng;

fn main() {
    println!("Guess the number from 1 to 100!");
    // `1..101`表示左闭右开区间，而`1..=100`表示左闭右闭区间
    let secret_number = rand::thread_rng().gen_range(1..101);
    loop { // 相当于 while(true) 死循环
        println!("Please input your guess:");
        let mut guess = String::new();
        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => {
                println!("Please input a number!");
                continue;
            }
        };

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

* `fn`用于声明一个函数，Rust 中的函数同样包含函数名、参数组以及函数体
* `let`可以创建变量，**Rust 中的变量默认是不可变的**，在变量名和`let`之间**添加`mut`关键字即声明可变变量**
* `read_line`和`parse`的返回值均为`Result`类型，该类型只有`Ok`和`Err`两种值，**可用`.expect`处理运行错误并输出提示信息**，不处理`Err`值则会警告
* `match`则类似于 C/C++ 中的 switch，可以根据判断值的不同执行不同的分支
* Rust 还可以支持定义两个不同的同名变量（如上述`guess`），这种特性称之为**遮蔽`shadowing`**