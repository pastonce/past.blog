> * 一般情况下，const是声明变量的一种方式，表示希望这个变量保持不变
> * const还可以修饰指针、引用与类中方法，比起强制约束更像是编写代码时约定的规范

## 修饰简单变量

`const`修饰一个简单变量时，表示这个变量不可以被修改（当然是可以绕过的），不再赘述。

## 修饰指针和引用

当`const`修饰指针时，则有三种用法，如下：

```c++
#include <iostream>

int main() {
    int MAX_AGE = 90;
    const int* a = new int; // 常量指针
    int* const b = new int; // 指针常量
    const int* const c = new int; // 常量指针常量
    
    // *a = 2;
    a = &MAX_AGE;
    *b = 2;
    // b = &MAX_AGE;
}
```

* 常量指针：可以改变指针的指向，不能改变指针指向的内容
* 指针常量：可以改变指针指向的内容，不能改变指针的指向
* 常量指针常量：指针指向和指针指向的内容均不可改变

另外，常量指针也可以写成`int const*`的形式，效果相同。

----

当`const`修饰引用时，由于**引用本身无法修改指向**（类似于一个指针常量`* const`），所以仅有一种用法：

* 常量引用：`const int&`，既不可改变引用指向（引用本身的性质），又不可改变引用的内容本身。常用于使用函数时传递一个不希望其修改的变量，同时也不会引发局部变量的拷贝。

又因为引用必须初始化，所以除了通过参数传递的方式定义，常量引用还可以用任意表达式作为初始值

## 修饰类中方法

当`const`修饰类中方法时，一般在方法的**参数组合之后、函数体之前**添加`const`关键字。其作用是不希望该方法修改类中的变量（不希望对类进行写操作），如下：

```c++
#include <iostream>

class Entity {
private:
    int m_X, m_Y;
    mutable int canBeWrote;
public:
    int GetX() const {
        // m_X = 2;
        canBeWrote = 5;
        return m_X;
    }
    void SetX(int x) {
        m_X = x;
    }
};

void PrintEntity(const Entity& e) {
    // e.SetX(4);
    std::cout << e.GetX() << std::endl;
}

int main() {
    Entity e;
    PrintEntity(e);
}
```

* 被`const`修饰的方法无法在其内部对任何普通变量（`m_X=2`）进行修改，否则会报错
* **类实例的常量引用只能调用被`const`修饰的方法**，否则不能保证该方法是否会违背常量引用的限制（即使该方法的函数体中未修改），会报错（`e.SetX(4)`）
* `mutable`关键字定义的变量**允许常量方法进行修改**，且常量引用调用该方法时也不会报错，一般用于开发调试（如调试类中常量方法被调用了多少次）
* 另外，`mutable`还可用于`lambda`函数中，详见[[C++自学 21] | C++原始函数指针与lambda函数](http://past-blog.vercel.app/blog/pointer-lambda-function)

