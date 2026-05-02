## std::optional(C++17)

更好地处理**可能存在也可能不存在**的数据，如读取文件：

```c++
#include <iostream>
#include <fstream>
#include <optional> // 头文件

std::optional<std::string> ReadFileAsString(const std::string& filepath) {
    std::ifstream stream(filepath);
    if (stream) {
        std::string result;
        // 读文件过程
        stream.close();
        return result;
    }
    return {}; // 构造一个 std::optional
}

int main() {
    std::optional<std::string> data = ReadFileString("data.txt");
    
    std::string value = data.value_or("");
    if (data) {
        std::cout << "File read successfully!\n";
    } else {
        std::string& string = *data; // 解引用访问
        // data.value();
        std::cout << "File could not be opened!\n";
    }
}
```

* 如果无法打开文件时传出空字符串，会混淆文件里没有内容的情况，因此传统做法是多返回值（打开状态和文件内容，详见[[C++自学 20] | C++中的auto关键字以及多返回值处理](https://past-blog.vercel.app/blog/auto-multi-return)）
* `value_or(指定值)`方法在`std::optional`类型为空时会得到传入的指定值，否则取出非空的原值（即带有默认值的`value()`方法）

## std::variant(C++17)

更好地存储一个**可以接受多种指定类型**的数据

```c++
#include <iostream>
#include <variant> // 头文件

int main() {
    std::variant<std::string, int> data;
    data = "Past";
    std::cout << data.index() << " " << std::get<std::string>(data) << "\n";
    // 0 Past
    data = 7;
    std::cout << data.index() << " " << std::get<int>(data) << "\n";
    // 1 7
    if (auto value = std::get_if<std::string>(&data)) {
        std::string& v = *value;
    } else {
        ...
    }
    
    std::cout << sizeof(int) << std::endl; // 4
    std::cout << sizeof(std::string) << std::endl; // 32
    std::cout << sizeof(data) << std::endl; // 40
}
```

* 在创建`std::variant`变量时可以指定可存储的各种类型，通过`index()`方法可以得知当前存储值类型的索引
* `get_if(指定类型)`判断当前存储值是否为指定类型，传回指向当前存储值的指针或空指针
* **功能上相当于更加类型安全的联合体**`union`（详见[[C++自学 23] | C++类-8-类型双关、联合体与虚析构函数](https://past-blog.vercel.app/blog/pun-union-virtual)），但实际上`std::variant`是通过**结构体或类**进行实现的，不同类型的值作为成员变量存在，因此其大小至少是所有类型的变量大小之和（而非最大成员的大小）

## std::any(C++17)

更好地存储一个**可以接受任意类型**的数据

```c++
#include <iostream>
#include <any> // 头文件

int main() {
    std::any data;
    data = 7;
    data = "Past";
    data = std::string("Past");
    
    std::string& string = std::any_cast<std::string&>(data);
}
```

* 与`std::variant`不同，获取指定类型的值的引用时需要模板参数也传入类型的引用
* `std::any`在存储小类型时在栈上分配，但超过一定字节数就会在堆上分配，带来**复制问题**（因此不常用）