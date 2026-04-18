> * 宏可以让预处理器在**代码被编译之前**将代码中的文本**直接替换**为指定内容
> * 宏中指定的内容可以是任何代码，且编译器实际上感触不到任何的宏

## 基础用法

宏常在调试以及日志系统等场景中发挥较大作用，但过度使用会严重降低程序可读性（~~除非要进行防御性编程~~）。一般来讲，宏可以像下面这样使用：

```c++
#include <iostream>

#define WAIT std::cin.get();
#define PR_DEBUG 1 // 开关控制是否输出调试信息

#if PR_DEBUG == 1
#define LOG(x) std::cout << x << std::endl
#else
#define LOG(x)
#endif

int main() {
    LOG("Hello!"); // Hello!
    WAIT
}
```

* 宏可以被替换为任意内容，`WAIT`宏定义时附带了分号，因此代码中`WAIT`不加分号也可以正常运行，但这样使用会导致可读性下降
* 可以定义带参数的宏，看起来类似于模板`template`，但它**无需指定参数类型**，只是简单的文本替换
* 结合其他预处理指令`if/else、ifdef/ifndef`等，可以实现调试和生产环境的代码差分，调试开关通过使用一个宏（如上的`PR_DEBUG`）来实现

```c++
#include <iostream>

#define MAIN int main()\
{\
    std::cout << "Hello!" << std::endl;\
    std::cin.get();\
}

#if 0
呜呜呜，无论怎么在这里发癫
也不会被编译器大人看到的！
#endif

MAIN // Hello!
```

* 可以通过反斜杠符号（替代换行符）实现宏中多行的替换内容
* 也可以使用`#if 0`和`#endif`注释掉任意内容，它们之间的内容相当于**直接被删除**
* 和模板的另一个不同在于，宏是让**预处理器**为你写代码（但是更加轻量化），所以上述两段程序在编译器眼中是一模一样的

## 宏中的#和##运算符

```c++
#include <iostream>
#include <string>

#define MKSTR(x) #x
#define concat(a, b) a ## b

int main ()
{
    std::string xy = MKSTR(HELLO C++);
    std::cout << concat(x, y) << std::endl; // HELLO C++
}
```

* `#`运算符会将替换内容转换为用引号引起来的字符串常量
* `##`运算符会将前后两个内容简单连接起来

## C++中的预定义宏

|  预定义宏  |                             功能                             |
| :--------: | :----------------------------------------------------------: |
| `__LINE__` |                        定义为当前行号                        |
| `__FILE__` |                 定义为当前文件名（包括后缀）                 |
| `__DATE__` | 定义为把源文件转换为目标代码的日期，形式为`month day year`的字符串 |
| `__TIME__` |  定义为程序被编译的时间，形式为`hour:minute:second`的字符串  |

**我们预处理器也有属于自己的模板*