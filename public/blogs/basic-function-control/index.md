## 变量

Rust 使用`let`声明一个变量，默认情况下声明的变量是**不可变**的，即变量绑定的值无法改变，无法重新赋予新值

* 声明变量：`let variable = 1;`

* **声明可变变量**：`let mut mut_variable = 1;`

* 遮蔽`Shadowing`：**Rust 允许用相同的变量名声明一个新变量，此后第一个变量的值（和类型）就被第二个变量遮蔽了**

    ```rust
    fn main() {
        let x = 5;
        let x = x + 1;
        {
            let x = x * 2;
            println!("The value of x in the inner scope is: {x}"); // 12
        }
        println!("The value of x is: {}", x); // 6
        let x:char = 'A';
        println!("The value of x is: {}", x); // A
    }
    ```

## 常量

Rust 使用`const`声明一个常量，一旦为常量赋值后就永远不可变，且**仅可以使用常量表达式赋值（编译时可知）**

* 不可以使用`mut`，**必须标注类型**
* 可以在任意作用域（包括全局）内声明
* 例：`const THREE_HOUSE_IN_SECONDS: u32 = 60 * 60 * 3;`

## 基本数据类型

Rust 中的基本数据类型分为两大类：**标量类型`Scalar`和复合类型`Compound`**，`Scalar`表示一个单一的值，`Compound`表示将多个值组合在一个类型

### Scalar

* 整数类型`Integer`：Rust 中的原始整数类型见下表，**`isize`和`usize`的位数依计算机实际系统位数而定**

    | 位长度（bit） | `Signed`有符号 | `Unsigned`无符号 |
    | :-----------: | :------------: | :--------------: |
    |       8       |       i8       |        u8        |
    |      16       |      i16       |       u16        |
    |      32       |  i32（默认）   |       u32        |
    |      64       |      i64       |       u64        |
    |      128      |      i128      |       u128       |
    |     arch      |     isize      |      usize       |

    Rust 中的整型字面值书写规则见下表，其中的**下划线只起到增加可读性的作用，无数值意义**

    |     数值字面值      |       example       |
    | :-----------------: | :-----------------: |
    |    Decimal十进制    |       98_222        |
    |     Hex十六进制     |      **0x**ff       |
    |     Octal八进制     |      **0o**77       |
    |    Binary二进制     |   **0b**1111_0000   |
    | Byte（u8 only）字节 | **b**'A'（表示 65） |

* 浮点类型`Floating Point`：分为`f32`与`f64`，都是有符号数，默认为`f64`

* 布尔类型`Boolean`：类型名为`bool`，大小固定一个字节，只有`true`和`false`两个值

* 字符类型`Character`：类型名为`char`，**大小固定四个字节，可以表示一个 Unicode 标量值（并非 ASCII）**，只用单引号

    * 例：`let chinese_char = '我';`	`let emoji_char = '🥰';`

### Compound

Rust 中的复合类型分为`Tuple`元组和`Array`数组两种，前者是不同数据类型的集合，后者是相同数据类型的集合

* 元组`Tuple`：**赋值后固定长度**，无法再增删元素；可包含不同数据类型的元素

    ```rust
    let my_tuple = ('A', 1, 1.2);
    let tup:(i32, f64, u8) = (500, 16.4, 1); // 声明元素的数据类型
    let five_hundred = tup.0; // 取用指定元素
    let (x, y, z) = my_tuple; // 解构
    ```

* 数组`Array`：**赋值后固定长度**；元素的数据类型必须相同

    ```rust
    let my_arr = [1, 2, 3];
    let my_arr_typed:[i32; 3] = [1, 2, 3]; // 声明元素数据类型和个数
    let a = [3; 5]; // 另一种声明方式，相当于 [3, 3, 3, 3, 3]
    let first = my_arr[0]; // 取用指定元素
    let [x, y , z] = my_arr; // 解构
    ```

## 函数 Functions

一个函数由四个基本组件构成：名称+参数+返回类型+函数体。

* Rust 中一般使用**蛇形命名法**命名函数，如`print_value`

* 函数中的接收参数必须标明类型，以`value: i32, label: char`的形式呈现

* 函数体由**不返回值的语句**和**返回值的表达式**组成，特殊的是，Rust 中支持以下写法：

    ```rust
    let y = {
        let x = 3;
        x + 1
    }; // 即 y = 4
    ```

    **大括号中的内容相当于一个表达式**，注意`x + 1`后没有分号，反之`y`为空值

* Rust 中可以使用`->`声明函数返回值的类型，且返回时既可以使用`return`，也可以是函数体中**最后一个表达式的值**，**默认返回一个空元组`()`**

    ```rust
    fn f(x: i32) -> i32 { x + 1 } // f(3) = 4
    ```

## 控制流 Control Flow

* `if`表达式：支持`if->else if->else`，条件不用括号包裹，且条件必须是布尔类型，**不支持`if 变量 {...}`的写法**

    * 三元表达式：`let number = if 条件 { 5 } else { 6 };`。需要注意此种写法**各个分支的返回值类型必须一致**，因为 Rust 需要在编译前确定变量类型

* `loop`循环：相当于一个死循环，可在语句体内使用`continue`和`break`

    * **`break`后可跟一个表达式**，作用类似于`return`，如：

        ```rust
        let mut counter = 0;
        let result = loop {
            counter += 1;
            if counter == 10 {
                break counter * 2;
            }
        }; // 即 result = 20
        ```

    * `loop`支持标签，可用标签标记循环，并**使用`break/continue 标签`直接操作指定循环**

        ```rust
        let mut count = 0;
        'counting_up: loop { // 只有一个单引号！
            let mut remaining = 10;
            loop {
                if remaining == 9 {
                    break;
                }
                if count == 2 {
                    break 'counting_up; // 标签后仍可以跟表达式
                }
                remaining -= 1;
            }
            count += 1;
        }
        ```

    * `while`循环：无特别用法，暂略

    * `for`循环：Rust 中的`for`循环类似于 Python，支持`for number in tuple {...}`用法，也可以使用`range`表达式如`for number in 1..100 {...}`（表示[1, 100)左闭右开区间）