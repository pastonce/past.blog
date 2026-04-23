## namespace命名空间

> * 命名空间可以作为附加信息来区分不同库中相同名称的函数、类、变量等
> * 主要用于**避免命名冲突**，而不用将库的实际名称嵌入到函数、类、变量名中

**类本身就是命名空间**，因此引用类中成员也要使用`::`符号，不同的是类有额外开销

```c++
#include <iostream>
#include <string>
#include <algorithm>

namespace apple {
    namespace function {
        void print(const char* text) {
            std::cout << text << std::endl;
        }   
    }
}
namespace orange {
    void print(const char* text) {
        using namespace std; // 仅作示例，尽量对 std 少用
        string temp = text;
        reverse(temp.begin(), temp.end());
        cout << temp << endl;
    }
}

void print(const std::string& text) {
    std::cout << text << std::endl;
}

int main() {
    namespace af = apple::function;
    af::print("Hello"); // Hello
    
    using orange::print;
    print("Hello"); // olleH
    ::print("Hello"); // Hello
}
```

* `using namespace xxx`表示该命名空间内的所有成员均可在当前作用域内直接使用
* 可以使用类似`namespace af = apple::function`的方式为（嵌套）命名空间**取别名**
* `using orange::print`表示仅`orange`命名空间的该`print`函数可以直接使用
* 当有同名的局部和全局变量同时存在时，可以使用`::print()`的形式来使用全局变量或函数
* 尽量**在尽可能小的作用域中**使用`using namespace`，否则可能难以分清使用函数的来源或出现运行时错误

---

## 类型转换

C++是强类型语言，一般情况下必须坚持变量类型，除非存在以下两种情况：

* 隐式转换，即编译器在编译阶段**自动执行**转换，详见[[C++自学 12] | C++类-4-成员初始化列表、隐式转换与explict关键字](https://past-blog.vercel.app/blog/class-4)
* 显式转换，即手动进行强制类型转换，有C风格和C++风格两种方式，后者更加严格和规范

```c++
#include <iostream>

int main() {
    double a = 3.14;
    int value1 = a; // 隐式转换
    int value2 = (int)(a) + value1; // C风格显式转换
    
    std::cout << "value1: " << value1 << std::endl; // 3
    std::cout << "value2: " << value2 << std::endl; // 6
}
```

* 隐式转换以及不当的显式转换有可能导致**数据丢失**，C风格的显式转换将所有情况混合在一起，代码不够清晰

* C++风格的显式转换细分了四类，统一格式为`*_cast<类型>(变量)`，加强了类型转换的可视性：

    * `static_cast`：主要用于**基本数据类型**的转换以及父类子类之间指针或引用的**上行转换**

    * `dynamic_cast`：在运行时执行转换，并对类的类型进行检查，确保转换的安全性；主要用于父类子类之间指针或引用的**下行转换**，转换失败返回`nullptr`（指针）或抛出异常（引用）；在进行下行转换时，可以在运行时检查父类指针或引用是否实际指向一个子类对象

    * `const_cast`：用于移除或添加类型的`const`属性，**不改变类型本身**

    * `reinterpret_cast`：允许在不同类型之间进行二进制级别的类型转换，不会进行任何类型检查，只是**重新解释二进制位的含义**

        