> * 模板允许定义一个可以根据使用用途进行编译的代码块，是创建泛型类或函数的蓝图
> * 模板是泛型编程的基础，泛型编程即以一种**独立于任何特定类型**的方式编写代码
> * 编译器在编译时实际在进行编程，即“让编译器为你写代码”

模板的声明或定义只能在全局，命名空间或类范围内进行。模板内并非真正的实际代码，只有在**实际调用**时，模板中的函数或类才会使用给定的模板参数被真正创建。因此，`MSVC`等一些编译器不会对不使用的模板中的语法错误进行报错

## 函数模板

```c++
#include <iostream>
#include <string>

template<typename T> // 也可以写成 template<class T>
void Print(T value) {
    std::cout << value << std::endl;
}

int main() {
    Print<int>(4);
    Print<std::string>("Past");
    Print<float>(3.14159f);
}
```

* 上述代码中编译器能正确推导出模板参数的类型，那么此时也可以忽略传入类型不写
* 免去了写出对应三种传入参数类型的`Print`重载函数的麻烦
* 函数模板同样**可以重载**，只要它们的形参表不同即可，如下：

```c++
template<class T1, class T2>
void Print(T1 arg1, T2 arg2) {
  std::cout << arg1 << " " << arg2 << std::endl; 
}
template<class T>
void Print(T arg1, T arg2) {
  std::cout << arg1 << " " << arg2 << std::endl;
}
```

## 类模板

模板参数可以存在多个，除了传入类型参数，还可以自定义变量（非类型形参）；非类型形参在模板定义的内部是常量值，且传入的实参必须是一个**编译时常量**。下面的代码实现了在栈上创建一个指定元素类型和大小的数组的类：

```c++
#include <iostream>
#include <string>

template<typename T = int, int N = 5>
class Array {
private:
    T m_Array[N];
public:
    int GetSize() const { return N; }
};

int main() {
    Array<std::string, 4> array;
    std::cout << array.GetSize() << std::endl; // 4
    Array<> array_default; // 使用默认模板参数
    std::cout << array_default.GetSize() << std::endl; // 5
}
```

* 可以为模板的类型形参和非类型形参提供默认值

## 使用总结

* 优势：支持编写与类型无关的代码，提高代码复用性，减少代码重复
* 劣势：可能增加编译时间，代码可读性降低，报错难以排查
* 可以用于日志系统等包含不同类型的统一缓冲区管理中

**模板是函数或类本身的函数（进一步抽象），即给定模板参数，编译后返回对应的函数或类代码*