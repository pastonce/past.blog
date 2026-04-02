> * 类是逻辑相关的一组数据和功能的组合体
> * 类并不提供新的功能，只是简化代码、增加可读性，**用类能够实现的功能不用类也可以实现**

## 类的定义

```c++
class Player {
public:
	int x = 0, y = 0;
	int speed;
    
    void Move(int xa, int ya) {
        x += xa * speed;
        y += ya * speed;
    }
};

// void Move(Player& player, int xa, int ya) {
//     player.x += xa * player.speed;
//     player.y += ya * player.speed;
// }

int main() {
    Player Nahida;
    Nahida.speed = 4;
    // Move(Nahida, 1, -1);
    Nahida.Move(1, -1);
}
```

* 其中，`Player`实质上是一个自定义数据类型（详见[[C++自学 3] | C++变量、函数与头文件](blog/variable-function)），所以不同的类不能重名。通常称`Player`为对象，而新的对象变量`Nahida`称为实例，`line 18`这行操作是将`Player`**对象实例化**了
* **默认情况下，类中的所有成员均为私有的**。可以通过`public`和`private`关键字声明相应变量的可见性
* 类中的函数也被称为方法，可以看到同一功能在类内外定义与使用的不同，逻辑上相关的函数定义在类内更加方便与简洁

## 可见性

> * 可见性指类中的成员变量和方法可以在哪些范围中被访问和使用

* `private`：类成员的默认修饰符，表示仅能在该类中（以及被`friend`修饰的友元）访问和使用，即使是继承（详见[[C++自学 8] | C++类-3-继承、虚函数与接口](https://past-blog.vercel.app/blog/class-3)）父类的子类也无法访问父类的私有成员
* `protected`：表示能在该类、该类的友元以及其所有子类中访问和使用
* `public`：结构体成员的默认修饰符，表示在所有范围中都可以访问和使用

**可见性是人为的约束，实际上不会给代码和运行过程带来大的变化，但可以让程序员方便快速地理解使用一段陌生代码，有利于独立编程、合作开发*

## 类和结构体的区别

* 默认情况下，类的成员是私有的，结构体的成员是公有的
* 一般结构体适合仅表示数据的结构，类则适合包含大量功能与面向对象的特性（封装、继承、多态）
* **两者在功能上可以相互替代**

## Log类的实现

```c++
#include <iostream>

class Log{
public:
    const int LogLevelError = 0;
    const int LogLevelWarn = 1;
    const int LogLevelInfo = 2;
private:
    int m_LogLevel = LogLevelInfo;
public:
    void SetLogLevel(int level) {
        m_LogLevel = level;
    }

    void error(const char* message) {
        if (m_LogLevel >= LogLevelError) {
            std::cout << "[ERROR]: " << message << std::endl;
        }
    }

    void warn(const char* message) {
        if (m_LogLevel >= LogLevelWarn) {
            std::cout << "[WARN]: " << message << std::endl;
        }
    }

    void info(const char* message) {
        if (m_LogLevel >= LogLevelInfo) {
            std::cout << "[INFO]: " << message << std::endl;
        }
    }
};

int main() {
    Log log;
    
    log.SetLogLevel(log.LogLevelWarn);
    log.error("This is an error message.");
    log.warn("This is a warning message.");
    log.info("This is an info message.");
	// [ERROR]: This is an error message.
	// [WARN]: This is a warning message.
    return 0;
}
```

* 实现类时一般先明确需求，然后填充各种成员变量和方法（比如此处的`Log`类需要日志级别及其设置、各日志级别的消息输出）
* 类中重要的成员变量（如`m_LogLevel`）的可见性应设为`private`，而修改该变量的方法（如`SetLogLevel`）的可见性则设为`public`，这样可以在类外有限制地使用重要成员变量
* 不同类别的成员建议分区，如公有常量、公有变量、私有变量、公有函数、私有函数等