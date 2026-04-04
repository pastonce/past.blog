> * 字符串是依次相接的一组字符，是一种能够表示和处理文本的数据形式
> * 字符串本质上是一个**字符数组**

## C风格字符串

```c++
#include <iostream>

int main() {
    const char* name1 = "Past";
    char name2[4] = {'P', 'a', 's', 't'};
    char name3[5] = {'P', 'a', 's', 't', '\0'};
    std::cout << name1 << ", " << strlen(name1) << std::endl; // Past
    std::cout << name2 << std::endl; // 如：Past@@
    std::cout << name3 << std::endl; // Past
}

```

* 字符串是**不可变**的，即不能扩展大小、不能修改删减，因此常用`const`来修饰定义
* 双引号`""`默认类型为`char*`，单引号`''`默认类型为`char`
* 字符串末尾固定存在空终止符`\0`，用来确定字符串大小与终止位置

## C++ string库字符串

```c++
#include <iostream>
#include <string>

int main() {
    std::string name = std::string("Past") + " hello!";
    // std::string name = "Past";
    // name += " hello!";
    std::cout << name << ", " << name.size() << std::endl; // Past hello!, 11
}
```

* `std::string`的定义其实存在于`iostream`库中，但想要输出字符串到控制台需要包含`string`库
* `string`库中对运算符`+`和`+=`做了重载，支持两个`std::string`以及`std::string`和C风格字符串的运算操作；另外`string`库也实现了一些基于字符串的方法，见下节
* 由于字符串的复制较为耗时，因此在传递字符串时通常使用**常量引用**`const std::string&`的方式而不是局部变量，因为后者会导致拷贝出一个新字符串

## string库常用成员函数

|                 函数名                  |                            描述                            |
| :-------------------------------------: | :--------------------------------------------------------: |
|           `size()`/`length()`           |                       返回字符串长度                       |
|                `empty()`                |                     检查字符串是否为空                     |
|       `substr(索引位置,子串长度)`       |          获取指定索引位置开始的指定长度的子字符串          |
|             `find(字符串)`              |         查找给定字符串在当前字符串中的起始索引位置         |
| `replace(索引位置,替换长度,替换字符串)` | 从当前字符串中给定索引位置开始，替换指定长度的子字符串内容 |
|             `at(索引位置)`              |        访问字符串中给定索引位置的字符（带边界检查）        |
|             `rfind(字符串)`             |           类似`find()`，但是从字符串末尾开始查找           |
|            `append(字符串)`             |                  在当前字符串末尾添加内容                  |
|     `insert(索引位置，插入字符串)`      |              在当前字符串指定索引位置插入内容              |
|       `erase(索引位置，删除长度)`       |       删除当前字符串给定索引位置开始的指定长度的内容       |
|                `c_str()`                |                     返回C风格的字符串                      |

上表内容参考自[C++ 标准库 \<string\> | 菜鸟教程](https://www.runoob.com/cplusplus/cpp-libs-string.html)

## 字符串字面量
**待补充**
