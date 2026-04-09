## 成员初始化列表

> * 成员初始化列表是在构造函数中初始化成员变量的一种方式
> * **应在代码中尽可能地使用成员初始化列表**

成员初始化列表常用于类的构造函数中，替代对类的变量的赋值代码，可以**让代码更加易读**，如下面代码中的`Entity`的两个构造函数，它们在执行结果上是等效的（`int x`只是为了重载区分）：

```c++
#include <iostream>
#include <string>

class Example {
public:
    Example() {
        std::cout << "Created Entity!" << std::endl;
    }
    Example(int x) {
        std::cout << "Created Entity with" << x << std::endl;
    }
};

class Entity {
private:
    std::string m_Name;
    Example m_Example;
public:
    Entity()
        : m_Name("Unknown"), m_Example(4)
    {
    }
    Entity(int x) {
        m_Name = "Unknown";
        m_Example = Example(8);
    }
};

int main() {
    Entity e1;
    // Created Entity with4
    Entity e2(1);
    // Created Entity!
    // Created Entity with8
}
```

实际上在将类对象实例化时。会对所有类变量按顺序执行一个默认初始化（如创建变量、类变量实例化等），**成员初始化列表的功能即为覆写这部分默认的初始化过程**，因此下面两点需要注意：

* 类成员初始化列表的赋值顺序**不会改变**程序根据类变量的定义顺序依次初始化这个事实（即上述`Entity`类永远先初始化`m_Name`再初始化`m_Example`），但如果不按顺序写可能会导致各种依赖性问题
* `Entity`中的两个构造函数并非只有形式上的差别，使用成员初始化列表可以**提高性能**，因为`Entity e1`仅构造一次`Example`类对象，而`Entity e2(1)`会因为默认初始化和赋值构造两次

## 隐式转换与explicit关键字

C++在构造类对象的实例时**默认支持隐式转换**，即不必显式调用构造函数，程序会自动使用传入参数调用相应的构造函数将其隐式转换为类实例。

```c++
#include <iostream>
#include <string>

class Entity {
private:
    std::string m_Name;
    int m_Age;
public:
    Entity(const std::string& name) : m_Name(name), m_Age(-1) {}
    explicit Entity(int age) : m_Name("Unknown"), m_Age(age) {} // 强制显式调用
};

void PrintEntity(const Entity& entity) {

}

int main() {
    // PrintEntity("Past"); // 两次隐式转换
    PrintEntity(Entity("Past"));
    PrintEntity(std::string("Past"));
    // PrintEntity(18); // explicit禁止
    PrintEntity(Entity(18));
    
    // Entity a = "Past"; // 两次隐式转换
    Entity b = Entity("Past");
    Entity c = std::string("Past");
    // Entity d = 18; // explicit禁止
    Entity d(18);
}
```

* **在同一语句中不支持两次及以上的隐式转换**，如`PrintEntity("Past")`和`Entity a = "Past"`需要将`const char[]`转换为`std::string`，再调用构造函数转换为`Entity`实例，会报错；将上述两次转换显式转换其中一次即可
* 不仅定义类实例变量时支持隐式转换，函数传递类实例参数时同样支持
* 用`explicit`关键字修饰构造函数，可以强制使用该构造函数时**必须显式调用**