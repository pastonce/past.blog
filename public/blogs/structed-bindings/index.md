传统的`std::pair`和`std::tuple`可以很方便地定义一些轻量化的数据类型，但使用其中的成员变量时可读性较低（详见[[C++自学 20] | C++中的auto关键字以及多返回值处理](https://past-blog.vercel.app/blog/auto-multi-return)）；`std::tie`似乎能解决一些问题，如：

```c++
std::set<int> ist{ 5, 8, 12, 7, 9};

std::set<int>::iterator iter;
bool inserted;
std::tie(iter, inserted) = ist.insert(7)
...
```

可以看到，**有意义的变量名可以提高代码的可读性**，但是使用`std::tie`仍然需要提前定义要绑定的数据，理论上这两个变量的类型是可以自动推导出来的，因此发展为结构化绑定这一特性。

> * 结构化绑定允许同时从元组、结构体等复合类型中提取成员变量，并将它们绑定到命名变量上。

## 基本用法

使用结构化绑定的各项复合类型取数据的简单示例如下：

```c++
// pair
std::pair<int, std::string> p(500, "1031");
atuo [age, name] = p;
// tuple
std::tuple<int, std::string, double> t(1, "Hello", 2.0);
auto [i, s, d] = t;
// array
std::array<int, 3> arr{1, 2, 3};
auto [a, b, c] = arr;
// struct
struct Point {
    int x, y;
};
Point p{11, 5102};
auto [x, y] = p;
```

可以根据需要使用以上这些复合类型**更好地处理函数的多返回值**。另外结构化绑定还可以**和范围`for`循环结合**使用，简化对容器元素的处理，例如：

```c++
// vector
std::vector<int> v{1, 2, 3};
for (auto i: v) {
    std::cout << i << std::endl;
}
// map
std::map<int, std::string> dataMap{{1, "one"}, {2, "two"}};
for (const auto& [key, value]: dataMap) {
    // 处理每个键值对
}
```

像上述代码所写的一样，结构化绑定也**支持`const`和引用修饰符**，可以保护数据和避免不必要的复制。

## 注意事项

* 结构化绑定不能用于类类型，除非该类提供了相应的结构化绑定支持，如特化`std::get`或提供`tie`成员函数
* 绑定的变量必须是**可以被初始化**的类型，且初始化**不会引发歧义**
* 使用结构化绑定时要注意不要带来不必要的复制，这回导致一定的性能代价
* **`c++ 17`及以上**的版本才支持结构化绑定的特性