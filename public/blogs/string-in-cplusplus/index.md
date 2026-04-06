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

### 常见操作

C风格字符串通过包含`cstring`库可以使用若干字符串操作函数

|        函数名        |                            描述                             |
| :------------------: | :---------------------------------------------------------: |
| `strcpy(str1, str2)` |                  复制字符串`str2`到`str1`                   |
| `strcat(str1, str2)` |            连接字符串`str2`到字符串`str1`的末尾             |
|    `strlen(str)`     |                    返回字符串`str`的长度                    |
| `strcmp(str1, str2)` | 从前向后比较字符串，相同返回0，前者小返回负值，否则返回正值 |

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
* 支持直接将C风格字符串的值赋给一个`std::string`变量
* 由于字符串的复制较为耗时，因此在传递字符串时通常使用**常量引用**`const std::string&`的方式而不是局部变量，因为后者会导致拷贝出一个新字符串

### 常用成员函数

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

> * 字符串字面量是在双引号`""`之间的一串字符，**只存储在内存的只读区域**
> * 字符串字面量实际上是`const char*`或`const char[]`类型

```c++
#include <iostream>

int main() {
    const char* name1 = u8"Past"; // utf8（u8前缀可省略）
    const wchar_t* name2 = L"Past"; // 2或4个字节，由编译器决定
    const char16_t* name3 = u"Past"; // utf16
    const char32_t* name4 = U"Past"; // utf32
    
    std::wcout << name2 << std::endl;
    std::wcout << reinterpret_cast<const wchar_t*>(name3) << std::endl;
    std::wcout << reinterpret_cast<const wchar_t*>(name4) << std::endl;
    // 转换为宽字符串以显示
}
```

字符串字面量是编译时常量，只是简单表示字符序列，没有任何操作函数；而字符串则是动态分配的，标准库提供了丰富的操作函数和操作符用于字符串的操作和处理

### 简单前后缀

* 前缀`R`：（C++11及以上版本）表示**省略引号、换行符等转义操作**的原始字符串字面量，格式为`Rxxx(字符串)xxx`，两侧的`xxx`必须一致但在字符串解析时会被忽略，一般不加，如：

```c++
const char* multilineStr = R"(This is a
multi-line
string literal.)";
const char* pathStr = R"(C:\Users\xxx\Desktop\C++)";
```

* 后缀`s`：（C++14及以上版本）可以在不显式调用构造函数的情况下将字符串字面量转换为`std::string`类型，（必须使用`std::literals::string_literals`或 `std::string_literals`命名空间，否则编译器无法识别）如：

```c++
using namespace std::string_literals;
std::string name = "Past"s + " hello!";
```