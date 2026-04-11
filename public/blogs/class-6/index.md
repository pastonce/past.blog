> * 浅拷贝：浅拷贝是一种对象复制方式，它**只复制对象的成员变量值**，而不复制它们所指向的资源
> * 深拷贝：深拷贝也是一种对象复制方式，其中对象的成员变量值被复制，同时**资源也被复制**，每个对象都有自己独立的资源副本

## 赋值总是在复制值

默认情况下，每当用赋值运算符将一个变量设置为另一个变量时，总是在复制值（引用除外）。对于指针而言，只会复制指针的值（即地址），而非复制出一块新的内存区域。

```c++
#include <iostream>
#include <string>
#include <cstring>

class String {
private:
    char* m_Buffer;
    unsigned int m_Size;
public:
    String(const char* string) {
        m_Size = strlen(string);
        m_Buffer = new char[m_Size + 1];
        memcpy(m_Buffer, string, m_Size);
        m_Buffer[m_Size] = 0;
    }
    ~String() {
        delete[] m_Buffer; // 释放内存
    }
    
    char& operator[](unsigned int index) {
        return m_Buffer[index];
    } 
    // 友元可以使用private成员
    friend std::ostream& operator<<(std::ostream& stream, const String& string);
};

std::ostream& operator<<(std::ostream& stream, const String& string) {
    stream << string.m_Buffer;
    return stream;
}

int main() {
    String s1 = "Past";
    String s2 = s1;
    s2[0] = 'C';
    
    std::cout << s1 << std::endl; // Cast
    std::cout << s2 << std::endl; // Cast
}
```

* 上述代码中两个输出均为`Cast`的原因是，将`s1`赋值给`s2`时只是浅拷贝，这导致两个`m_Buffer`指针指向同一块内存区域，因此两者的修改也是同时进行的
* 在程序结束前会报错，是因为两个`String`实例均会调用自己的析构函数，将同一块内存区域反复释放了两次，出现了野指针

## 拷贝构造函数

拷贝构造函数也是一种构造函数（详见[[C++自学 7] | C++类-2-枚举、构造与析构函数](https://past-blog.vercel.app/blog/class-2)），当对一个类实例进行复制时会被调用。C++默认提供一个拷贝构造函数，即对整块内存进行浅拷贝，如下：

```c++
...
class String {
    ...
public:
    // String(const String& other) { // 默认拷贝构造函数
    //     memcpy(this, &other, sizeof(String));
    // }
    // String(const String& other) = delete; // 禁止复制
    String(const String& other) 
        : m_Size(other.m_Size)
    {
        std::cout << "Copied String!" << std::endl;
        m_Buffer = new char[m_Size + 1];
        memcpy(m_Buffer, other.m_Buffer, m_Size + 1);
    }
    ...
};

void PrintString(String string) {
    std::cout << string << std::endl;
}
...

int main() {
    String s1 = "Past";
    String s2 = s1; // Copied String!
    s2[0] = 'C';
    
    PrintString(s1);
    // Copied String!，改为常量引用则消失
    // Past
    PrintString(s2);
    // Copied String!，改用常量引用则消失
    // Cast
}
```

* [[C++自学 14] | C++智能指针](https://past-blog.vercel.app/blog/smart-pointer)中`std::unique_ptr`的不可复制性也是通过上述代码中`delete`实现的
* `String s2 = s1;`这句代码实际上发生了隐式转换（详见[[C++自学 12] | C++类-4-成员初始化列表、隐式转换与explict关键字](https://past-blog.vercel.app/blog/class-4)），调用了相应参数类型的构造函数，即拷贝构造函数
* `Past`与`Cast`的不同表明拷贝构造函数实现了深拷贝，即同时复制指针指向的内存区域
* 后两次`Copied String!`输出表示**值传递形式的函数传参同样是简单复制 / 浅拷贝**（只不过这里触发了拷贝构造函数），复制一般会带来开销，因此尽量用常量引用方式（详见[[C++自学 11] | C++中的CONST关键字](https://past-blog.vercel.app/blog/const-keyword)）传递类实例