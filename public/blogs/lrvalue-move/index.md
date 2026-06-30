## C++的左值和右值

> * 左值是有地址的值
> * 右值是临时值

* 非const引用的初始值必须是左值，const引用的初始值可以为右值是因为**编译器用右值创建了一个临时变量**
* 一般用`&`修饰的引用均为左值引用，只接受左值；**右值引用通过`&&`修饰，只接受右值**
* 如果函数能够明确它接收了一个右值，那么可以在函数内随意使用该值，因为它是一个临时变量

```c++
#include <iostream>
void PrintName(std::string& name) {
    std::cout << "[lvalue]: " << name << std::endl;
}
void PrintName(std::string&& name) {
    std::cout << "[rvalue]: " << name << std::endl;
}
int main() {
    std::string firstName = "Past";
    std::string lastName = "Once";
    std::string fullName = firstName + lastName;
    // int& a = 10; // 报错
    const int& b = 10;
    PrintName(fullName); // 左值
    PrintName(firstName + lastName); // 右值
    // [lvalue]: PastOnce
    // [rvalue]: PastOnce
}
```

## 移动构造函数

在一些情况下，一些对象不得不先构造再复制传递，这会导致内存与性能的浪费，特别是一些对象还需要动态分配。一个例子如下：

```c++
#include <iostream>
#include <cstring>
class String {
public:
    String() = default;
    String(const char* string) { // 此处忽略终止符
        std::cout << "Created!" << std::endl;
        m_Size = strlen(string);
        m_Data = new char[m_Size];
        memcpy(m_Data, string, m_Size);
    }
    String(const String& other) {
        std::cout << "Copied!" << std::endl;
        m_Size = other.m_Size;
        m_Data = new char[m_Size];
        memcpy(m_Data, other.m_Data, m_Size);
    }
    ~String() {
        std::cout << "Destroyed!" << std::endl;
        delete[] m_Data;
    }
    void Print() {
        for (uint32_t i = 0; i < m_Size; i++)
            printf("%c", m_Data[i]);
        printf("\n");
    }
private:
    uint32_t m_Size;
    char* m_Data;
};

class Entity {
public:
    Entity(const String& name)
        : m_Name(name) {}
    void PrintName() {
        m_Name.Print();
    }
private:
    String m_Name;
};
int main() {
    Entity entity("Past");
    entity.PrintName();
    // Created!
    // Copied!
    // Destroyed!
    // Past
    // Destroyed!
}
```

* 上述代码实现了一个自定义字符串类以及一个Entity类操作该自定义字符串对象，可以看到首先隐式构造了一个String对象临时变量（`Created!`），然后传入Entity类的构造函数时在`line 35`触发了String类的拷贝构造函数（`Copied!`），最终在进入`line 44`前自动销毁了临时变量（`Destroyed!`）
* 上述过程产生了两次内存的动态分配，**额外的第二次是由于编译器为常量引用`Entity(const String& name)`接收一个右值`Past`创建了一个String对象临时变量**
* 执行流的重要节点：`line 43`$\rightarrow$`line 6`$\rightarrow$`Created!`$\rightarrow$**`line 34`**$\rightarrow$**`line 12`**$\rightarrow$`Copied!`$\rightarrow$`Destroyed!`$\rightarrow$`line 44`$\rightarrow$`Past`$\rightarrow$`Destoryed!`
* 这种不必要的动态分配可以通过右值引用重载构造函数来实现，修改如下：

```c++
#include <iostream>
#include <cstring>
class String {
public:
    String() = default;
    String(const char* string) { // 此处忽略终止符
        std::cout << "Created!" << std::endl;
        m_Size = strlen(string);
        m_Data = new char[m_Size];
        memcpy(m_Data, string, m_Size);
    }
    String(const String& other) {
        std::cout << "Copied!" << std::endl;
        m_Size = other.m_Size;
        m_Data = new char[m_Size];
        memcpy(m_Data, other.m_Data, m_Size);
    }
    String(String&& other) { // 新增
        std::cout << "Moved!" << std::endl;
        m_Size = other.m_Size;
        m_Data = other.m_Data; // 浅拷贝
        other.m_Size = 0;
        other.m_Data = nullptr; // 避免指针悬挂
    }
    ~String() {
        std::cout << "Destroyed!" << std::endl;
        delete[] m_Data;
    }
    void Print() {
        for (uint32_t i = 0; i < m_Size; i++)
            printf("%c", m_Data[i]);
        printf("\n");
    }
private:
    uint32_t m_Size;
    char* m_Data;
};

class Entity {
public:
    Entity(const String& name)
        : m_Name(name) {}
    Entity(String&& name) // 新增
        : m_Name(std::move(name)) {}
    void PrintName() {
        m_Name.Print();
    }
private:
    String m_Name;
};
int main() {
    Entity entity("Past");
    entity.PrintName();
    // Created!
    // Moved!
    // Destroyed!
    // Past
    // Destroyed!
}
```

* 在String类和Entity类中都添加了接收右值引用的构造函数，即移动构造函数
* `line 18-24`实际上是将编译器创建的临时变量进行浅拷贝加以利用，因此避免了二次动态分配；由于临时变量很快会被销毁，所以应用`line 23`避免指针悬挂；这一部分**确保了传入右值String对象后的正确构造**
* `line 43-44`**确保了传入右值`Past`后Entity类的正确构造**，如果不使用**`std::move`将左值移动为右值**，则仍会调用原始的拷贝构造函数触发二次动态分配，这说明**右值引用变量仍然是左值**；在本例中，`(String&&)name`也能发挥相同作用
* 执行流的重要节点：`line 52`$\rightarrow$`line 6`$\rightarrow$`Created!`$\rightarrow$**`line 43`**$\rightarrow$**`line 18`**$\rightarrow$`Moved!`$\rightarrow$`Destroyed!`$\rightarrow$`line 53`$\rightarrow$`Past`$\rightarrow$`Destoryed!`
* 移动语义就是让左值（如接收到的右值引用变量）重新变为右值（即临时值）进行后续处理，以避免复制问题

## std::move 与移动赋值操作符

> * C++三法则：如果需要析构函数，则一定需要拷贝构造函数和拷贝赋值操作符
> * C++五法则：为了支持移动语义，需要额外增加移动构造函数和移动赋值运算符

`std::move`可以将一个对象变量转换为临时对象，从而可以移动该临时对象上的资源；除了**在对象创建时**使用移动构造函数，还可以通过移动赋值运算符对**已有变量**进行移动赋值：

```c++
#include <iostream>
#include <cstring>
class String {
public:
    String() = default;
    String(const char* string) { // 此处忽略终止符
        std::cout << "Created!" << std::endl;
        m_Size = strlen(string);
        m_Data = new char[m_Size];
        memcpy(m_Data, string, m_Size);
    }
    String(const String& other) {
        std::cout << "Copied!" << std::endl;
        m_Size = other.m_Size;
        m_Data = new char[m_Size];
        memcpy(m_Data, other.m_Data, m_Size);
    }
    String(String&& other) {
        std::cout << "Moved!" << std::endl;
        m_Size = other.m_Size;
        m_Data = other.m_Data;
        other.m_Size = 0;
        other.m_Data = nullptr;
    }
    String& operator=(String&& other) {
        std::cout << "Moved!" << std::endl;
        if (this != &other) { // 只在不是同一个对象时移动
            delete m_Data;
            m_Size = other.m_Size;
            m_Data = other.m_Data; // 浅拷贝
            other.m_Size = 0;
            other.m_Data = nullptr; // 避免指针悬挂
        }
        return *this;
    }
    ~String() {
        std::cout << "Destroyed!" << std::endl;
        delete m_Data;
    }
    void Print() {
        for (uint32_t i = 0; i < m_Size; i++)
            printf("%c", m_Data[i]);
        printf("\n");
    }
private:
    uint32_t m_Size;
    char* m_Data;
};

int main() {
    String apple = "Apple";
    // String dest = std::move(apple); 使用了移动构造函数
    String dest = "Pear";
    apple.Print(); // Apple
    dest.Print(); // Pear
    dest = std::move(apple); // 使用了移动赋值运算符
    apple.Print(); // (空)
    dest.Print(); // Apple
}
```

* `line 25-35`对赋值运算符进行了重载，需要注意**对当前对象的内存进行释放**，否则会造成内存泄漏；另外也**不能对同一对象执行移动**，否则会丢失数据