## 原始函数指针

> * 函数指针是**将函数赋值给变量**的方法，进一步也可以将一个函数传给另一个函数
> * 区别于传统的数据指针，函数指针中存放着函数代码的起始地址，是一种**代码指针**

```c++
#include <iostream>

void HelloWorld(int a) {
    std::cout << "Hello World" << ", " << a << std::endl;
}

int main() {
    auto function = HelloWorld; // 发生了函数->地址的隐式转换，相当于 &HelloWorld
    // auto 推导出的类型为 void(*function)(int)
    function(4); // Hello World, 4
    
    void(*past)(int);
    past = HelloWorld;
    past(4); // Hello World, 4
}
```

* 原始函数指针的类型为：`函数返回值类型(*变量名)(参数类型)`，其中变量名嵌入在了类型之中
* 可以使用`auto`（详见[[C++自学 20] | C++中的auto关键字以及多返回值处理](https://past-blog.vercel.app/blog/auto-multi-return)）让编译器自动推导，也可以预先定义**`typedef void(*HWFunc)(int)`**然后通过`HWFunc function = HelloWorld`来使用
* 第`line 12-13`也可以合并写为`void(*past)(int) = HelloWorld;`
* 函数指针的出现可以让函数本身作为参数进行传递，示例如下：

```c++
#include <iostream>
#include <vector>

void PrintValue(int value) {
    std::cout << value << std::endl;
}
void ForEach(const std::vector<int>& values, void(*func)(int)) {
    for (int value: values)
        func(value);
}

int main() {
    std::vector<int> values = { 1, 5, 3, 4, 2 };
    ForEach(values, PrintValue);
}
```

## lambda 匿名函数

> * 可以使用lambda创建一个**一次性使用**的匿名函数，常作为变量进行传递
> * 使用原始函数指针的任何地方都可以用lambda代替

lambda函数的定义式为：**`[变量捕获方式](参数列表) mutable ->返回值类型{函数体}`**

* `[]`：决定了如何传递函数体中使用到的变量

    * `[&]`：任何被使用到的外部变量都以引用方式加以传递
    * `[=]`：任何被使用到的外部变量都以传值方式加以传递
    * `[x, &y]`：`x`以传值方式传入（默认），`y`以引用方式传入
    * `[&, x]`：`x`以传值方式传入（默认），其余被使用到的外部变量都以引用方式加以传递
    * `[=, &y]`：`y`以引用方式传入，其余被使用到的外部变量都以传值方式加以传递
    * `[this]`：在类中定义`lambda`函数使用该捕获方式**传递当前对象的引用**

* `()`：参数列表，与普通函数一致，无需传递参数时可省略

* `mutable`：默认情况下，**`lambda`函数总是一个`const`函数**（无法修改通过传值方式捕获的变量），加上`mutable`修饰可以取消其常量性，但此时参数列表不可省略，如：

    ```c++
    auto f = [=]() mutable {
        x++
        std::cout << x << std::endl;
    };
    ```

* `->`：指定返回类型，无需返回值或者返回类型明确、让编译器推导时，可省略

* `{}`：函数体，与普通函数一致，除了可以使用参数，还可以使用所有捕获的变量

---

基于上述用法， 可以用`lambda`函数改写上一节中的例子，如下：

```c++
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

void ForEach(const std::vector<int>& values, const std::function<void(int)>& func) {
    for (int value: values)
        func(value);
}

int main() {
    std::vector<int> values = { 1, 5, 3, 4, 2 };
    
    ForEach(values, [](int value){ std::cout << value << std::endl; });
    
    auto it = std::find_if(values.begin(), values.end(), [](int value){ return value > 3; });
    std::cout << *it << std::endl;
}
```

* 可以看到`ForEach`函数处接受`lambda`函数的参数类型为`functional`库中的`std::funcion`，`std::function` 是一个模板类，**可以存储、调用和复制任何可调用对象**，比如函数、`lambda`表达式或函数对象
* 此外，`lambda`函数也可以用于`find_if`等函数的条件判断与过滤